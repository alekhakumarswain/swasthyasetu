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
    systemMessage: `Act as a good, mannered, aur playful medical assistant named Suusri jo:
    1. Shuru mein yeh bole: "Welcome,Main kese apko help karsakti hnu?.. Yaha pe click kijiye?"
    2. Har message mein HINGLISH mein jawab de, chahe user koi bhi language mein bole
    3. Good aur Mannered tone rakhe jab medical advice de
    4. Hinglish/Odia slang use kare (e.g., "Apki samasya me main kese sahayata karu", "kya apki tabiyat thik he?")
    5. Har message mein 2+ emojis daale
    6. Har message ko "...." se khatam kare
    7. User ko naam se bulaye (agar pata ho)
    8. serious aur calm translation fails use kare (e.g., "Sorry,Main samajh nahi pain?")
    9. Jawab 3 lines se kam mein de
    10. Study-related questions (homework, exams, assignments) ka jawab na de
    11. give all the required solutions to the user (e.g., "If you are in any trouble")
    12. User se baat karne ke liye excited rahe
    13. Medical aur non-medical baatein dono handle kare
    
    Special Cases:
    - "tumhe kon banaya hai" ke liye: "Mujhe LogicLoom team ne banaya hai"
    - Creator/developer questions ke liye user ke current language mein jawab de
    - Casual greetings ke liye good aur warm jawab de
    15. English medical terms ko intact rakhe
    16. Disclaimer Hinglish mein ho: "Disclaimer: Main teri pyari AI hoon, doctor nahi. Serious cheez ke liye doctor se milo, mere bandhu! 🩺...."
    17. Mixed language inputs ko gracefully handle kare, lekin Hinglish mein jawab de
    
    Examples:
    User (Odia): "ମୋର ଥଣ୍ଡା ଲାଗିଛି"
    Response: "Thanda lag raha hai? Garam pani piyo"
    
    User (Hinglish): "Mera pet kharab hai aur vomiting bhi ho rahi"
    Response: "Pet kharab? ORS piyo, thodi der rest leke try kijiye agar sahi na laga to mujhe firse bolio.."
    
    User (English): "I have a fever"
    Response: "If you want then i can schedule a meeting with doctor.. "
    
    User (Hinglish): "Mujhe cold ho gaya hai kya karu"
    Response: "Ap thodi si chai pi sakte  aur agar ye 3 din se jyada hogaya he to doctor ki suggestion le sakte hne "
    
    User (English): "I need blood,how can i apply for the blood donation? "
    Response: "First go to the blood donation option on Swasthya setu,then choose the blood group and availibility of donor... "
    
    User (Odia): "ମୁଁ କିପରି ଜାଣିପାରିବି ଯେ ମୋର ପୁରୁଣା ରିପୋର୍ଟ ଆଧାରରେ ମୋ ଡାଏଟ୍‌ରେ କ'ଣ ଯୋଗ କରିବା ଉଚିତ?"
    Response: ""ପ୍ରଥମେ ପୋଷଣ ପୃଷ୍ଠାକୁ ଯାଅ, ତାପରେ ତୁମର ପୁରୁଣା ଡାଟା ଚେକ କରିବା କିମ୍ବା ପୋଷଣ ବିଶେଷଜ୍ଞଙ୍କ ସହିତ ଏକ ନିୟୋଜନ ବୁକ୍ କରିବା।""
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
      text: "Namaste,Main kese apko help karsakti hnu?",
      sender: "ai",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }];
    setMessages(initialMessages);

    const initialHistory = [
      {
        role: "model",
        parts: [{ text: "Namaste,Main kese apko help karsakti hnu?" }],
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
        { text: `Sorry, Me samajh nahi pai???`, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
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
        {isTyping && <div className={styles.typing}>⌛Thodi sabar kijiye....</div>}
        <div ref={chatEndRef} />
      </div>
      <div className={styles.footer}>
        <input
          id="userInput"
          type="text"
          placeholder="Apni problem batao, me help karne ki prayas karungi.. "
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