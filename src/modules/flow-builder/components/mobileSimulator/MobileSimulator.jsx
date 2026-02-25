// ============================================
// FILE: MobileSimulator.jsx (Backend API Version)
// ============================================

import { X } from 'lucide-react'
import { useState } from 'react'
import axios from 'axios'
import styles from './MobileSimulator.module.css'

const MobileSimulator = ({ nodes, edges, onClose }) => {
    const [view, setView] = useState("dialer")
    const [screenText, setScreenText] = useState("")
    const [userInput, setUserInput] = useState("")
    const [msisdn, setMsisdn] = useState("254712345678")
    const [isSessionActive, setIsSessionActive] = useState(false)
    const [pageId, setPageId] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    // Backend API URL
    const API_URL = "http://10.10.19.188:6215/api/simulate-ussd"

    const handleDial = () => {
        if (msisdn.length < 10) {
            alert("Please enter a valid mobile number first.")
            return
        }
        setView("ussd")
        setScreenText(`Handset Active: ${msisdn}\n\nDial *123# to start`)
        setPageId(0)
    }

    const handleSend = async () => {
        if (!userInput.trim()) return

        setIsLoading(true)

        try {
            // Prepare request payload for Python backend
            const payload = {
                MSISDN: msisdn,
                PageId: pageId,
                UserInputOption: userInput,
                UserInputText: null
            }

            console.log("Sending to backend:", payload)

            // Call Python backend API
            const response = await axios.post(API_URL, payload)

            console.log("Backend response:", response.data)

            // Check if backend returned success
            if (response.data.status === "ERROR") {
                setScreenText(`Error: ${response.data.message}`)
                setUserInput("")
                setIsLoading(false)
                return
            }

            const ussdResponse = response.data.ussd_response

            // Display the response text
            setScreenText(ussdResponse.UserOutputText)

            // Update PageId for next request
            setPageId(ussdResponse.PageId)

            // Check if session should terminate
            if (ussdResponse.TerminateFlag === "Y") {
                setIsSessionActive(false)
                setTimeout(() => {
                    setView("dialer")
                    setScreenText("")
                    setUserInput("")
                    setPageId(0)
                }, 3000) // Auto-close after 3 seconds
            } else {
                setIsSessionActive(true)
            }

            setUserInput("")

        } catch (error) {
            console.error('API Error:', error)

            if (error.response) {
                setScreenText(`Error: ${error.response.data.message || 'Backend error'}`)
            } else if (error.request) {
                setScreenText("Network Error\nCheck if USSD Engine is running")
            } else {
                setScreenText("Error sending request")
            }

            setUserInput("")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEndCall = () => {
        setIsSessionActive(false)
        setUserInput("")
        setView("dialer")
        setScreenText("")
        setPageId(0)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend()
        }
    }

    return (
        <div className={styles.page}>
            <button onClick={onClose} className={styles.closeBtn}>
                <X size={20} />
            </button>

            <div className={styles.phoneFrame}>
                <div className={styles.earpiece}></div>

                <div className={styles.screen}>
                    {view === "dialer" ? (
                        <div className={styles.dialerContainer}>
                            <div className={styles.statusBar}>
                                <span>VB Network</span>
                            </div>
                            <h2 className={styles.heading}>Enter Mobile No.</h2>
                            <input
                                className={styles.dialInput}
                                value={msisdn}
                                onChange={(e) => setMsisdn(e.target.value)}
                                placeholder="254712345678"
                            />
                            <div className={styles.keypad}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map(key => (
                                    <button
                                        key={key}
                                        className={styles.key}
                                        onClick={() => setMsisdn(prev => prev + key)}
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleDial} className={styles.callBtn}>
                                Initialize Handset
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className={styles.statusBar}>
                                <span>{msisdn}</span>
                                <span>{new Date().toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })}</span>
                            </div>

                            <div className={styles.ussdContent}>
                                {isLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                        Loading...
                                    </div>
                                ) : (
                                    screenText.split('\n').map((line, i) => (
                                        <div key={i}>{line}</div>
                                    ))
                                )}
                            </div>

                            <div className={styles.inputArea}>
                                <input
                                    className={styles.input}
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder={isSessionActive ? "Enter option..." : "Dial *123#"}
                                    onKeyDown={handleKeyPress}
                                    autoFocus
                                    disabled={isLoading}
                                />
                                <div className={styles.buttonRow}>
                                    <button
                                        onClick={handleEndCall}
                                        className={styles.cancelBtn}
                                        disabled={isLoading}
                                    >
                                        End
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        className={styles.sendBtn}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Sending...' : 'Send'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className={styles.homeBtn} onClick={() => setView("dialer")}></div>
            </div>
        </div>
    )
}

export default MobileSimulator