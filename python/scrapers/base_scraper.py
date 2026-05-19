import os
import time
import random
import json
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

class BaseScraper:
    def __init__(self, keyword, topic, limit=10, use_mock=False):
        self.keyword = keyword
        self.topic = topic
        self.limit = limit
        self.use_mock = use_mock
        self.driver = None

    def init_driver(self):
        if self.use_mock:
            self.log("Running in MOCK mode (configured by system)")
            return True
        try:
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            # Anti-detection options
            chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)

            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # Execute script to disable webdriver flag
            self.driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
                "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            })
            return True
        except Exception as e:
            self.log(f"Failed to initialize Selenium driver: {str(e)}. Falling back to mock generator.")
            self.use_mock = True
            return True

    def log(self, message):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {message}", flush=True)

    def random_delay(self, min_sec=1, max_sec=3):
        delay = random.uniform(min_sec, max_sec)
        time.sleep(delay)

    def scroll_page(self, scroll_count=3):
        if not self.driver:
            return
        for i in range(scroll_count):
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            self.log(f"Scrolling page ({i+1}/{scroll_count})...")
            self.random_delay(2, 4)

    def scrape(self):
        raise NotImplementedError("Scrape method must be implemented by subclasses.")

    def close(self):
        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            self.log("Browser closed.")
