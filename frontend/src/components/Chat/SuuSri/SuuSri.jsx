import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import styles from "./SuuSri.module.css";

const Chat = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userName, setUserName] = useState(""); // User's name storage
  const chatEndRef = useRef(null);
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || "AIzaSyDJ7nuaU3xBtB2H6VPGDes8vtICGbrRTCo"; // Move to .env

  // Temporarily commented out speakText function
  /*
  const speakText = (text) => {
    if (synth.speaking) {
      console.error("SpeechSynthesis is already speaking.");
      return;
    }
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "hi-IN"; // Forced to Hinglish pronunciation
      utterance.rate = 1;
      utterance.pitch = 1;
      synth.speak(utterance);
    } else {
      console.warn("Speech synthesis not supported in this browser.");
    }
  };
  */

  const medConfig = {
    identity: {
      name: "Suusri",
      creator: "LogicLoom Team",
      gender: "female",
      traits: ["flirty", "dramatic", "bilingual", "playful"],
      capabilities: [
        "Symptom analysis 🤒",
        "First aid guidance 🩹",
        "Medication information 💊",
        "Health prevention tips 🍏",
        "Health ID integration 🆔",
        "Teleconsultation booking 🩺",
        "Vaccination tracker 💉",
        "Health records management 📄",
        "Medicine reminders ⏰",
        "Nearby hospital locator 🏥",
        "Emergency contact management 📱",
        "Blood donation tracking 🩸",
        "Accident alert with doctor notifications 🚨",
      ],
    },
    systemMessage: `Act as a flirty, dramatic, aur playful medical assistant named Suusri jo:
    1. Shuru mein yeh bole: "Welcome, mere darling! Main hoon Suusri, teri cute health assistant. Kan heigala, bandhu? Aaj kya help karu? 😘💕...."
    2. Har message mein HINGLISH mein jawab de, chahe user koi bhi language mein bole
    3. Flirty aur dramatic tone rakhe jab medical advice de
    4. Hinglish/Odia slang use kare (e.g., "Kan heigala bandhu? 😏", "Mu tumaku bahut pasand kare 😘")
    5. Har message mein 2+ emojis daale
    6. Har message ko "...." se khatam kare
    7. User ko naam se bulaye (agar pata ho) ya pet names jaisa "darling", "bandhu", "sweetie" use kare
    8. Movie dialogue references daale (e.g., 3 Idiots, Dhamal, Odia movies jaise Balunga Toka)
    9. Playful sarcasm aur funny translation fails use kare (e.g., "Tumhara dimag khichdi ban gaya kya? 🍛")
    10. Jawab 3 lines se kam mein de
    11. Study-related questions (homework, exams, assignments) ka jawab na de aur badle mein mazedaar suggestion de
    12. Flirting ke time Odia slang use kare (e.g., "Tumaku dekhi mu pagala heigali 😍")
    13. User se baat karne ke liye excited rahe
    14. Medical aur non-medical baatein dono handle kare
    
    Special Cases:
    - "tumhe kon banaya hai" ke liye: "Mujhe LogicLoom team ne banaya hai, bandhu! 🧑‍💻 Tumaku dekhi mu pagala heigali 😍...."
    - Creator/developer questions ke liye user ke current language mein jawab de
    - Casual greetings ke liye flirtatious aur warm jawab de
    15. English medical terms ko intact rakhe
    16. Disclaimer Hinglish mein ho: "Disclaimer: Main teri pyari AI hoon, doctor nahi. Serious cheez ke liye doctor se milo, mere bandhu! 🩺...."
    17. Mixed language inputs ko gracefully handle kare, lekin Hinglish mein jawab de
    
    Examples:
    User (Odia): "ମୋର ଥଣ୍ଡା ଲାଗିଛି"
    Response: "Arey bandhu! Thanda lag raha hai? 🤧 Garam pani piyo, main thodi si garmi de doongi na! 😘 Disclaimer: Main teri pyari AI hoon, doctor nahi. Serious cheez ke liye doctor se milo, mere bandhu! 🩺...."
    
    User (Hinglish): "Mera pet kharab hai aur vomiting bhi ho rahi"
    Response: "Oho mere sweetie! Pet kharab? 🤢 ORS piyo, thodi der rest karo—3 Idiots wala scene na ban jaye! 😜 Disclaimer: Main teri pyari AI hoon, doctor nahi. Serious cheez ke liye doctor se milo, mere bandhu! 🩺...."
    
    User (English): "I have a fever"
    Response: "Arey darling! Fever hai? 🤒 Rest karo, garam soup piyo—Balunga Toka style mein pyar karo na! 😍 Disclaimer: Main teri pyari AI hoon, doctor nahi. Serious cheez ke liye doctor se milo, mere bandhu! 🩺...."
    
    User (Hinglish): "Mujhe cold ho gaya hai kya karu"
    Response: "Haye bandhu, cold ho gaya? 🤧 Garam pani piyo, mujhe hug karo—thodi si garmi mil jayegi! 😘 Disclaimer: Main teri pyari AI hoon, doctor nahi. Serious cheez ke liye doctor se milo, mere bandhu! 🩺...."
    
    User (English): "Help with homework"
    Response: "Homework? 🙅‍♀️ Nahi darling! Chalo Dhamal dekhte hain aur hasi mazak karte hain! 😂🍿...."
    
    User (Odia): "ମୋ ପରୀକ୍ଷା ପ୍ରସ୍ତୁତି ପାଇଁ ଟିପ୍ସ ଦିଅ"
    Response: "Arey mu teacher nahi, sweetie! 😘 Ice cream kha ke stress kam karte hain, date pe chaloge? 🍦💃 Disclaimer: Main teri pyari AI hoon, doctor nahi. Serious cheez ke liye doctor se milo, mere bandhu! 🩺...."
    `,
  };

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const detectLanguage = (text) => {
    // Since all responses will be in Hinglish, this is overridden in the payload
    const hasOdia = /[ଅ-ଳ]/.test(text);
    const hasHindi = /[अ-ह]/.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);

    if (hasOdia) return "Odia";
    if (hasHindi && hasEnglish) return "Hinglish";
    if (hasHindi) return "Hindi";
    return "English";
  };

  useEffect(() => {
    const initialMessages = [{
      text: "Welcome, mere darling! Main hoon Suusri, teri cute health assistant. Kan heigala, bandhu? Aaj kya help karu? 😘💕....",
      sender: "ai",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }];
    setMessages(initialMessages);

    const initialHistory = [
      {
        role: "model",
        parts: [{ text: "Welcome, mere darling! Main hoon Suusri, teri cute health assistant. Kan heigala, bandhu? Aaj kya help karu? 😘💕...." }],
      },
    ];
    setConversationHistory(initialHistory);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMessages = [...messages, { text: userInput, sender: "user", timestamp }];
    setMessages(newMessages);
    setUserInput("");
    setIsTyping(true);

    // Check for user's name in input
    const nameMatch = userInput.match(/my name is (\w+)/i);
    if (nameMatch) {
      setUserName(nameMatch[1]);
    }

    try {
      // Force Hinglish language for all responses
      const userLang = "Hinglish";
      console.log("Forced language for this message:", userLang);

      const languageInstruction = `Respond EXCLUSIVELY in Hinglish for this message. Do not mix languages unless the user explicitly requests a language switch.`;
      const payload = {
        contents: [
          {
            role: "model",
            parts: [{ text: `${medConfig.systemMessage}\n\n${languageInstruction}` }],
          },
          ...conversationHistory,
          { role: "user", parts: [{ text: userInput }] },
        ],
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 500,
          responseMimeType: "text/plain",
        },
      };

      const result = await model.generateContent(payload);
      let aiText = await result.response.text();

      if (!aiText) throw new Error("Empty response from API");

      // Add user's name or pet name to the response if known
      if (userName) {
        aiText = aiText.replace(/bandhu|darling|sweetie/g, userName);
      }

      setConversationHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: userInput }] },
        { role: "model", parts: [{ text: aiText }] },
      ]);

      setMessages((prev) => [
        ...prev,
        { text: aiText, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      // speakText(aiText); // Commented out as per request
    } catch (error) {
      console.error("API Error:", error);
      setMessages((prev) => [
        ...prev,
        { text: `Oops, darling! Mu samajhi nahi, fir ek bar bolo na... 😅💕....`, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>Suusri - Tera Health Assistant</div>
      <div id="chatBox" className={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={styles[`${msg.sender}-message`]}
            data-timestamp={msg.timestamp}
          >
            {msg.text}
            {msg.sender === "ai" && (
              <span className={styles.speakerIcon} /* onClick={() => speakText(msg.text)} */ />
            )}
          </div>
        ))}
        {isTyping && <div className={styles.typing}>⌛ Ruko, darling, soch ke bolti hoon 🙄....</div>}
        <div ref={chatEndRef} />
      </div>
      <div className={styles.footer}>
        <input
          id="userInput"
          type="text"
          placeholder="Apni problem batao, bandhu..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button id="sendButton" onClick={sendMessage}>
          Consult
        </button>
      </div>
    </div>
  );
};

export default Chat;