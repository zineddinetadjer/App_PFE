import os
import sys
import random
import json
from datetime import datetime, timedelta
from base_scraper import BaseScraper

class TwitterScraper(BaseScraper):
    def scrape(self):
        self.init_driver()
        results = []

        if self.use_mock:
            results = self.generate_mock_data()
        else:
            try:
                self.log(f"Searching Twitter/X for: '{self.keyword}'")
                url = f"https://x.com/search?q={self.keyword}&f=live"
                self.driver.get(url)
                self.random_delay(4, 6)
                
                # Check for login redirect/wall
                if "login" in self.driver.current_url or "Log in to Twitter" in self.driver.page_source:
                    self.log("Twitter/X requires login. Switching to fallback mock data.")
                    results = self.generate_mock_data()
                    self.use_mock = True
                    return results

                self.scroll_page(2)
                
                # Extract tweets
                tweets = self.driver.find_elements("css selector", "article[data-testid='tweet']")
                if not tweets:
                    self.log("No tweets found. Attempting mock data fallback.")
                    results = self.generate_mock_data()
                    self.use_mock = True
                    return results

                self.log(f"Found {len(tweets)} tweets. Extracting content...")
                
                count = 0
                for tweet in tweets:
                    if count >= self.limit:
                        break
                    try:
                        # Extract content
                        text_elem = tweet.find_element("css selector", "div[data-testid='tweetText']")
                        content = text_elem.text
                        
                        # Extract author
                        author_elem = tweet.find_element("css selector", "div[data-testid='User-Name']")
                        author = author_elem.text.split("\n")[1] # gets @username
                        
                        # Extract link
                        link_elem = tweet.find_element("css selector", "a[href*='/status/']")
                        tweet_url = link_elem.get_attribute("href")
                        
                        title = f"Tweet de {author}"
                        timestamp = datetime.now() - timedelta(hours=random.randint(1, 24))
                        
                        results.append({
                            "title": title,
                            "content": content,
                            "source": "Twitter/X",
                            "author": author,
                            "timestamp": timestamp.isoformat(),
                            "url": tweet_url,
                            "sentiment": "NEUTRAL"
                        })
                        count += 1
                    except Exception as e:
                        continue
                        
                if not results:
                    results = self.generate_mock_data()
            except Exception as e:
                self.log(f"Error during Twitter/X scraping: {str(e)}. Using fallback mock data.")
                results = self.generate_mock_data()
            finally:
                self.close()

        return results

    def generate_mock_data(self):
        self.log(f"Generating mock Twitter/X data for '{self.keyword}' in topic '{self.topic}'")
        tweets_templates = [
            "Je viens de lancer mon nouveau projet de {topic} en utilisant {keyword} ! L'expérience développeur est incomparable par rapport aux anciens outils. Je le recommande vivement ! 🚀🔥",
            "Honnêtement déçu par la dernière mise à jour de {keyword} pour {topic}. Ils ont déprécié des fonctionnalités sans aucun avertissement. Un vrai cauchemar à déboguer ce matin. 😤 #devlife",
            "Pouvons-nous parler de la façon dont {keyword} a complètement changé la donne pour {topic} en 2026 ? Les optimisations de performance à elles seules valent la migration. 📊🧠",
            "Est-ce que quelqu'un d'autre rencontre des problèmes de latence élevée lors de l'exécution de {keyword} dans des tâches {topic} ? Je me demande s'il y a une fuite de mémoire dans le dernier correctif. 💻 #coding",
            "J'ai passé le week-end à réécrire tout notre pipeline {topic} avec {keyword}. Lignes de code réduites de 40 %, tests s'exécutant 2x plus vite. Ça fait plaisir ! 😎🚀",
            "Conseil rapide pour tous ceux qui débutent avec {keyword} dans {topic} : assurez-vous de configurer correctement votre cache, sinon vous rencontrerez des blocages de base de données. Ne me demandez pas comment je le sais... 😭",
            "Flash info : Grande annonce de l'équipe {keyword} concernant l'intégration native avec {topic}. C'est énorme ! 🌐📈",
            "Évaluation de {keyword} par rapport à d'autres alternatives pour notre prochaine application d'entreprise {topic}. Des avis ou études de cas à partager ? 🤝"
        ]

        handles = ["dev_guru", "tech_lead", "cloud_native", "code_artisan", "sysadmin_daily", "startup_ceo", "ai_pioneer", "web_dev_expert"]

        results = []
        count = min(self.limit, 15)
        for i in range(count):
            content = random.choice(tweets_templates).format(keyword=self.keyword, topic=self.topic)
            author = f"@{random.choice(handles)}_{random.randint(10, 999)}"
            timestamp = datetime.now() - timedelta(hours=random.randint(0, 72))
            
            results.append({
                "title": f"Tweet de {author}",
                "content": content,
                "source": "Twitter/X",
                "author": author,
                "timestamp": timestamp.isoformat(),
                "url": f"https://x.com/{author[1:]}/status/mock_{random.randint(10000000, 99999999)}",
                "sentiment": "NEUTRAL"
            })
        return results

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python twitter_scraper.py <keyword> <topic> [limit] [use_mock]")
        sys.exit(1)
    
    keyword = sys.argv[1]
    topic = sys.argv[2]
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    use_mock = sys.argv[4].lower() == 'true' if len(sys.argv) > 4 else False

    scraper = TwitterScraper(keyword, topic, limit, use_mock)
    data = scraper.scrape()
    print(json.dumps(data))
