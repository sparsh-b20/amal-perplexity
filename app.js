const express = require("express");
const axios = require("axios");
//const router = express.Router();
const app = express();
require('dotenv').config(); 
app.use(express.json());
//app.use(router); 
async function scrapeWebsite(url) {
    try {
      const response = await axios({
        method: "post",
        url: "https://scrape.serper.dev",
        headers: {
          "X-API-KEY": process.env.SERP_API_PERPLEXITY,
          "Content-Type": "application/json",
        },
        data: {
          url:  url,
        },
        timeout: 5000,
      });
  
      console.log("Response data:", response.data);
      return response.data.text;
    } catch (error) {
      console.error("Error during API call:", error.message);
      return "";
    }
  }
  
app.post("/news/query", async (req, res) => {
  const { message } = req.body;

  try {
    const serpApiConfig = {
      method: "post",
      url: "https://google.serper.dev/images",
      headers: {
        "X-API-KEY": process.env.SERP_API_PERPLEXITY,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({ q: message, num: "50" }),
      timeout: 5000,
    };

    const serpResponse = await axios(serpApiConfig);
    const { images } = serpResponse.data;

    const parseSources = async (images) => {
      const validateImageLink = async (url) => {
        try {
          const response = await axios.head(url, { timeout: 2000 });
          return response.status === 200;
        } catch (_) {
          return false;
        }
      };

      const sourcesParsed = await Promise.all(
        images.map(async (item) => {
          const isAccessible = await validateImageLink(item.imageUrl || "");
          return isAccessible
            ? {
                title: item.title || "No Title",
                link: item.link || "",
                image: item.imageUrl || "",
              }
            : null;
        })
      );
      return sourcesParsed.filter(Boolean);
    };

    const sourcesParsed = await parseSources(images);

    const fetchPageContent = async (link) => {
      try {
        let content = await scrapeWebsite(link);
        content = content.split(" ").slice(0, 300).join(" ");
        return { content, link };
      } catch (error) {
        console.error(`Failed to fetch content for ${link}:`, error.message);
        return { content: "", link };
      }
    };

    const processAndVectorizeContent = async (item) => {
      const { content } = await fetchPageContent(item.link);
      return { ...item, searchResults: content };
    };

    const sourcesWithContent = (
      await Promise.allSettled(sourcesParsed.map(processAndVectorizeContent))
    )
      .filter(
        (result) => result.status === "fulfilled" && result.value.searchResults
      )
      .map((result) => result.value)
      .slice(0, 10);

    // Transform to the new structure
    const data = sourcesWithContent.map(item => ({
      title: item.title,
      image: item.image,
      source: item.link,
      description: item.searchResults
    }));

    res.status(200).json({
      data,
      message: "200" // Or "success" if preferred
    });
  } catch (error) {
    console.error("Error processing request:", error.message);
    res.status(500).json({
      data: [],
      message: error.message // Or "500" + error.message if needed
    });
  }
});
// New GET endpoint for positive news updates
app.get("/getnews", async (req, res) => {
    try {
      const curr_year = new Date().getFullYear();
      const prev_year = curr_year - 1;
      const message = `Provide 5 positive news updates from the Middle East in the year ${curr_year} and ${prev_year} about sports, business, AI, Blockchain and technology`;
  
      const serpApiConfig = {
        method: "post",
        url: "https://google.serper.dev/images",
        headers: {
          "X-API-KEY": process.env.SERP_API_PERPLEXITY,
          "Content-Type": "application/json",
        },
        data: JSON.stringify({ q: message, num: "50" }),
        timeout: 5000,
      };
  
      const serpResponse = await axios(serpApiConfig);
      const { images } = serpResponse.data;
  
      const parseSources = async (images) => {
        const validateImageLink = async (url) => {
          try {
            const response = await axios.head(url, { timeout: 2000 });
            return response.status === 200;
          } catch (_) {
            return false;
          }
        };
  
        const sourcesParsed = await Promise.all(
          images.map(async (item) => {
            const isAccessible = await validateImageLink(item.imageUrl || "");
            return isAccessible
              ? {
                  title: item.title || "No Title",
                  link: item.link || "",
                  image: item.imageUrl || "",
                }
              : null;
          })
        );
        return sourcesParsed.filter(Boolean);
      };
  
      const sourcesParsed = await parseSources(images);
  
      const fetchPageContent = async (link) => {
        try {
          let content = await scrapeWebsite(link);
          content = content.split(" ").slice(0, 300).join(" ");
          return { content, link };
        } catch (error) {
          console.error(`Failed to fetch content for ${link}:`, error.message);
          return { content: "", link };
        }
      };
  
      const processAndVectorizeContent = async (item) => {
        const { content } = await fetchPageContent(item.link);
        return { ...item, searchResults: content };
      };
  
      const sourcesWithContent = (
        await Promise.allSettled(sourcesParsed.map(processAndVectorizeContent))
      )
        .filter(
          (result) => result.status === "fulfilled" && result.value.searchResults
        )
        .map((result) => result.value)
        .slice(0, 10);
  
      // Transform to the new structure
      const data = sourcesWithContent.map(item => ({
        title: item.title,
        image: item.image,
        source: item.link,
        description: item.searchResults
      }));
  
      res.status(200).json({
        data,
        message: "200" // Or "success" if preferred
      });
    } catch (error) {
      console.error("Error processing request:", error.message);
      res.status(500).json({
        data: [],
        message: error.message // Or "500" + error.message if needed
      });
    }
  });

  
  
  
  
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
