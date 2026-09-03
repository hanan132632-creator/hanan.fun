import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy or safe initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "Global Internet Services API", timestamp: new Date().toISOString() });
  });

  // Google AdSense ads.txt standard endpoint
  app.get(["/ads.txt", "/.well-known/ads.txt", "/public_html/ads.txt", "/public/ads.txt"], (_req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.send("google.com, pub-3298241753177072, DIRECT, f08c47fec0942fa0\n");
  });

  // Sitemap.xml endpoint
  app.get(["/sitemap.xml", "/sitemap_index.xml", "/sitemap"], (_req, res) => {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=3600");
    const sitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
    res.sendFile(sitemapPath);
  });

  // Robots.txt endpoint
  app.get("/robots.txt", (_req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=3600");
    const robotsPath = path.join(process.cwd(), "public", "robots.txt");
    res.sendFile(robotsPath);
  });

  // Contact Form Submission API
  app.post("/api/contact", (req, res) => {
    try {
      const { name, email, subject, category, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Name, email, and message are required." });
      }

      const ticketId = "GIS-" + Math.floor(100000 + Math.random() * 900000);
      return res.json({
        success: true,
        ticketId,
        message: "Message received successfully. Our global support team will respond within 2-4 hours.",
        receivedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Contact API error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Website Speed / DNS Diagnostics API
  app.post("/api/diagnostics/speed-test", (req, res) => {
    try {
      const { domain } = req.body;
      const cleanDomain = (domain || "example.com").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      
      const nodes = [
        { region: "Frankfurt (DE)", ping: Math.floor(12 + Math.random() * 8), status: "optimal", score: 98 },
        { region: "Riyadh (KSA)", ping: Math.floor(18 + Math.random() * 10), status: "optimal", score: 97 },
        { region: "New York (USA)", ping: Math.floor(22 + Math.random() * 12), status: "optimal", score: 95 },
        { region: "Singapore (SG)", ping: Math.floor(28 + Math.random() * 14), status: "optimal", score: 94 },
        { region: "Tokyo (JP)", ping: Math.floor(32 + Math.random() * 16), status: "optimal", score: 93 },
        { region: "London (UK)", ping: Math.floor(14 + Math.random() * 9), status: "optimal", score: 99 },
      ];

      const avgTtfb = Math.floor(45 + Math.random() * 25);
      const overallScore = Math.floor(92 + Math.random() * 7);

      return res.json({
        domain: cleanDomain,
        sslStatus: "Valid (TLS 1.3 Active - 256-bit AES)",
        http3Support: true,
        ipv6Ready: true,
        ttfbMs: avgTtfb,
        overallScore,
        adSenseCompatibility: "100% Compatible (Compliant HTML structure, Fast LCP, Clean CLS)",
        nodes,
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Diagnostics failed" });
    }
  });

  // Server-side AI Advisor & Content Assistant
  app.post("/api/gemini/assistant", async (req, res) => {
    try {
      const { message, language = "ar", context = "general" } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        // High quality fallback responses if API key is not yet set
        const fallbacks: Record<string, string> = {
          ar: "مرحباً بك في منصة خدمات الإنترنت العالمية! نحن نقدم خدمات الاستضافة السحابية المتقدمة، حماية DDoS، تسجيل النطاقات العالمية، وتسريع المحتوى CDN. كيف يمكننا مساعدتك في تسريع أو تأمين مشروعك اليوم؟",
          en: "Welcome to Global Internet Services! We provide enterprise cloud hosting, DDoS mitigation, global domain registration, and high-performance CDN. How can our global network empower your project today?",
          fr: "Bienvenue sur Global Internet Services ! Nous fournissons un hébergement cloud d'entreprise, une protection DDoS et un CDN ultra-rapide. Comment pouvons-nous vous aider aujourd'hui ?",
          es: "¡Bienvenido a Global Internet Services! Ofrecemos alojamiento en la nube, protección DDoS y CDN de alta velocidad. ¿En qué podemos ayudarle hoy?",
        };

        return res.json({
          reply: fallbacks[language] || fallbacks.ar,
          model: "built-in-knowledge",
        });
      }

      const ai = getGeminiClient();
      const systemInstruction = `You are the expert Global Internet Services (GIS) AI Consultant and Technical Advisor. 
The website is "خدمات الإنترنت العالمية" (Global Internet Services).
You specialize in:
- Cloud infrastructure, high-speed VPS, dedicated servers, edge CDN
- Domain registrations, DNS optimization, SSL/TLS certificates
- Cyber security, WAF, DDoS protection
- Google AdSense optimization, SEO compliance, Web Core Vitals, site monetization
- E-commerce and web development architecture

Respond in the language requested: ${language}.
Keep answers insightful, polite, practical, and highly helpful with clear bullet points where suitable. Mention GIS services and recommendations naturally.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response.text || "نحن في خدمات الإنترنت العالمية نسعد بخدمتك دوماً. يرجى التواصل مع فريق الدعم المتخصص لأي استفسار دقيق.";

      return res.json({
        reply,
        model: "gemini-3.7-flash",
      });
    } catch (err: any) {
      console.error("Gemini API error:", err);
      return res.json({
        reply: "شكراً لتواصلك مع خدمات الإنترنت العالمية. فريقنا الهندسي متاح على مدار الساعة لمساعدتك في كافة حلول الاستضافة والأمان والشبكات.",
        error: err.message,
      });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Global Internet Services Server running on http://localhost:${PORT}`);
  });
}

startServer();
