"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, X, Mic, Volume2, MapPin, Download, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const LANGUAGES = {
  en: { name: "English", code: "en-US" },
  ta: { name: "Tamil", code: "ta-IN" },
  hi: { name: "Hindi", code: "hi-IN" },
  sa: { name: "Sanskrit", code: "sa-IN" },
  es: { name: "Spanish", code: "es-ES" },
  fr: { name: "French", code: "fr-FR" },
  ar: { name: "Arabic", code: "ar-SA" },
  pt: { name: "Portuguese", code: "pt-PT" },
  ru: { name: "Russian", code: "ru-RU" },
  id: { name: "Indonesian", code: "id-ID" },
}

type LanguageCode = keyof typeof LANGUAGES

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [language, setLanguage] = useState<LanguageCode>("en")
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showNearbySearch, setShowNearbySearch] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const { t, i18n } = useTranslation()

  // Sync internal speech recognition language with global i18n
  const currentLangCode = LANGUAGES[i18n.language as LanguageCode]?.code || "en-US";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.onstart = () => setIsListening(true)
        recognitionRef.current.onend = () => setIsListening(false)
        recognitionRef.current.onresult = (event: any) => {
          let transcript = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript
          }
          if (transcript) setInput(transcript)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: t("chatbot.greet"),
          timestamp: new Date(),
        },
      ])
    }
  }, [isOpen, t])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = currentLangCode
      recognitionRef.current.start()
    }
  }

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "assistant",
          content: "Geolocation is not supported by your browser. Please enable location services.",
          timestamp: new Date(),
        },
      ])
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const locationMessage = `Emergency Location Shared: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E (Accuracy: ${Math.round(accuracy)}m). This information has been sent to emergency services.`
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            role: "user",
            content: `📍 Sharing live location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            timestamp: new Date(),
          },
          {
            id: String(Date.now() + 1),
            role: "assistant",
            content: locationMessage,
            timestamp: new Date(),
          },
        ])
      },
      (error) => {
        const errorMessages: Record<string, string> = {
          "1": "Location permission denied. You can still use the chat for safety advice.",
          "2": "Location unavailable. Please check your device settings.",
          "3": "Location request timed out. Please try again.",
        }
        const message = errorMessages[String(error.code)] || "Unable to retrieve location."
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            role: "assistant",
            content: message,
            timestamp: new Date(),
          },
        ])
      },
    )
  }

  const handleSendMessage = () => {
    if (!input.trim()) return

    const newMessage: Message = {
      id: String(Date.now()),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInput("")
    setIsTyping(true)

    // Quick QA Logic removed to force complete LLM Autonomy for ALL queries!
    setTimeout(async () => {
      let replyContent = ""
      try {
         const answerRes = await fetch('/api/chat', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ query: input, language: i18n.language }) 
         });
         if (!answerRes.ok) throw new Error("Chat Endpoint Failed");
         const answerData = await answerRes.json();
         replyContent = answerData.answer;
      } catch {
         replyContent = "I am experiencing network difficulties reaching my AI Hub. Please check your connection.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: "assistant",
          content: replyContent,
          timestamp: new Date(),
        },
      ])
      setIsTyping(false)
    }, 100)
  }

  const handleTextToSpeech = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = currentLangCode
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleDownloadReport = async () => {
    try {
      const response = await fetch("/api/download-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `earthquake_report_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "assistant",
          content: "Excel report downloaded successfully!",
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error("[v0] Download error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "assistant",
          content: "Failed to download report. Please try again.",
          timestamp: new Date(),
        },
      ])
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg hover:shadow-xl transition-all flex items-center justify-center animate-pulse"
        >
          <Bot className="w-6 h-6 text-white" />
        </button>
      ) : (
        <Card className="w-96 max-h-[600px] flex flex-col bg-slate-800/95 border-cyan-500/30">
          <CardHeader className="pb-3 border-b border-cyan-500/20">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                {t("chatbot.title")}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-3">
              <Select value={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
                <SelectTrigger className="w-full bg-slate-700/50 border-cyan-500/30 text-slate-200 cursor-pointer">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-cyan-500/30">
                  {Object.entries(LANGUAGES).map(([code, { name }]) => (
                    <SelectItem key={code} value={code} className="cursor-pointer">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-blue-600" : "bg-cyan-600"
                    }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-xs rounded-lg p-3 ${msg.role === "user"
                      ? "bg-blue-600/30 border border-blue-500/30"
                      : "bg-slate-700/50 border border-cyan-500/20"
                    }`}
                >
                  <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => handleTextToSpeech(msg.content)}
                      className="mt-2 text-xs text-cyan-400 hover:text-cyan-300"
                      disabled={isSpeaking}
                    >
                      <Volume2 className="w-3 h-3 inline mr-1" />
                      {isSpeaking ? "Speaking..." : "Hear"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-600">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <div className="border-t border-cyan-500/20 p-3 space-y-2">
            {showNearbySearch && (
              <div className="bg-slate-700/30 rounded p-3 space-y-2 border border-cyan-500/20">
                <p className="text-xs text-slate-300 font-medium mb-2">Quick Actions:</p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleVoiceInput}
                    disabled={isListening}
                    size="sm"
                    className="text-xs flex-1 bg-slate-700/50 hover:bg-slate-700 border border-cyan-500/30"
                  >
                    <Mic className={`w-3 h-3 mr-1 ${isListening ? "text-red-400" : "text-cyan-400"}`} />
                    Voice
                  </Button>
                  <Button
                    onClick={handleShareLocation}
                    size="sm"
                    className="text-xs flex-1 bg-slate-700/50 hover:bg-slate-700 border border-cyan-500/30"
                  >
                    <MapPin className="w-3 h-3 mr-1 text-cyan-400" />
                    Location
                  </Button>
                  <Button
                    onClick={() => handleDownloadReport()}
                    size="sm"
                    className="text-xs flex-1 bg-slate-700/50 hover:bg-slate-700 border border-cyan-500/30"
                  >
                    <Download className="w-3 h-3 mr-1 text-cyan-400" />
                    Excel Report
                  </Button>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={t("chatbot.placeholder")}
                className="flex-1 bg-slate-700/50 border-cyan-500/30 text-white placeholder-slate-400"
              />
              <Button
                onClick={() => setShowNearbySearch(!showNearbySearch)}
                variant="outline"
                size="icon"
                className="border-cyan-500/30 bg-transparent"
                title="Open tools menu"
              >
                <Plus className={`w-4 h-4 ${showNearbySearch ? "text-cyan-400" : "text-cyan-400"}`} />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping}
                className="bg-cyan-600 hover:bg-cyan-700"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
