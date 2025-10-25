import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const CONFIG = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  WORDPRESS_URL: process.env.WORDPRESS_URL,
  WORDPRESS_USERNAME: process.env.WORDPRESS_USERNAME,
  WORDPRESS_APP_PASSWORD: process.env.WORDPRESS_APP_PASSWORD,
  SOCIALBEE_API_KEY: process.env.SOCIALBEE_API_KEY,
  OPENAI_MODEL: "gpt-4o-mini"
};

// 🧠 Generate affiliate article
async function generateArticle() {
  const prompt = `
  Write a detailed, SEO-optimized affiliate blog post recommending a trending product.
  Include a catchy title, engaging intro, product benefits, and call-to-action.
  Format with Markdown headings.
  `;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: CONFIG.OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "No content generated.";
  const [titleLine, ...bodyLines] = content.split("\n");
  return { title: titleLine.replace(/\*/g, "").trim(), content: bodyLines.join("\n") };
}

// 📝 Post to WordPress
async function postToWordPress(title, content) {
  const response = await fetch(`${CONFIG.WORDPRESS_URL}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${CONFIG.WORDPRESS_USERNAME}:${CONFIG.WORDPRESS_APP_PASSWORD}`).toString("base64"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title,
      content,
      status: "publish"
    })
  });

  const data = await response.json();
  console.log("✅ Posted to WordPress:", data.link);
  return data.link;
}

// 📣 Post to SocialBee
async function postToSocialBee(title, link) {
  if (!CONFIG.SOCIALBEE_API_KEY) {
    console.log("⚠️ No SocialBee API key found. Skipping SocialBee post.");
    return;
  }

  const res = await fetch("https://api-socialbee.io/v1/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.SOCIALBEE_API_KEY}`
    },
    body: JSON.stringify({
      content: `${title}\n${link}`,
      category: "Blog"
    })
  });

  console.log("✅ Shared on SocialBee!");
}

// 🕐 Main function
(async () => {
  try {
    console.log("🧠 Generating affiliate article...");
    const article = await generateArticle();

    console.log("📝 Posting to WordPress...");
    const link = await postToWordPress(article.title, article.content);

    console.log("📣 Sharing on SocialBee...");
    await postToSocialBee(article.title, link);

    console.log("🚀 All done! See you tomorrow for the next post!");
  } catch (err) {
    console.error("❌ Error:", err);
  }
})();

