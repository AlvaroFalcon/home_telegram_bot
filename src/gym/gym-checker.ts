import { config } from "dotenv";
import puppeteer from "puppeteer";

config();
const GYM_USERNAME = process.env.GYM_USERNAME;
const GYM_PASSWORD = process.env.GYM_PASSWORD;
const GYM_URL = process.env.GYM_URL;

type Response = {
  centerName: string;
  capacity: string;
  error?: string | undefined;
};

export async function loginAndScrape(): Promise<Response> {
  const response: Response = {
    centerName: "Desconocido",
    capacity: "Desconocido",
  };

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://myaltafit.provis.es/Login", {
    waitUntil: "networkidle2",
  });

  await page.type("#Username", GYM_USERNAME);
  await page.type("#Password", GYM_PASSWORD);

  await Promise.all([
    page.click("#submitLogin"),
    page.waitForNavigation({ waitUntil: "networkidle2" }),
  ]);

  await page.evaluate(() => {
    document
      .querySelectorAll('a[target="_blank"]')
      .forEach((link) => link.removeAttribute("target"));
  });

  const liElements = await page.$$("li.liVentajas");
  if (liElements.length === 0)
    console.error("No <li> elements with the specified class were found.");

  const lastLi = liElements[liElements.length - 1];
  await Promise.all([
    lastLi.click(),
    page.waitForNavigation({ waitUntil: "networkidle2" }),
  ]);
  const amountContainer = await page.$("g.apexcharts-datalabels-group");
  const textContents = await amountContainer.$$eval("text", (nodes) =>
    nodes.map((node) => node.textContent.trim())
  );
  const centerName = await page.$("a.btn.hover-elevate-up.pe-none");
  if (centerName) {
    const text = await page.evaluate((el) => el.textContent.trim(), centerName);
    response.centerName = text;
  } else {
    console.error("Element not found.");
  }
  response.capacity = textContents.join(" ");

  await browser.close();
  return response;
}
