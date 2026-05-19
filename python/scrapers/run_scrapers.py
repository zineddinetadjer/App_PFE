import os
import sys
import json
import argparse
from datetime import datetime
from reddit_scraper import RedditScraper
from twitter_scraper import TwitterScraper
from news_scraper import NewsScraper

def log(msg):
    # Envoi de logs horodatés sur stdout pour streaming SSE côté Node.js
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [MANAGER] {msg}", flush=True)

def main():
    # Définition des paramètres attendus en ligne de commande
    parser = argparse.ArgumentParser(description="Run InsightFlow Scrapers")
    parser.add_argument("--keyword", required=True, help="Keyword to search")
    parser.add_argument("--topic", required=True, help="Topic area")
    parser.add_argument("--sources", required=True, help="Comma-separated sources e.g. reddit,twitter,news")
    parser.add_argument("--limit", type=int, default=10, help="Max items per source")
    parser.add_argument("--mock", type=str, default="false", help="Force mock data")
    parser.add_argument("--output_dir", default="../datasets", help="Directory to save dataset JSON")
    
    args = parser.parse_args()
    
    keyword = args.keyword
    topic = args.topic
    sources_list = [s.strip().lower() for s in args.sources.split(",")]
    limit = args.limit
    use_mock = args.mock.lower() == "true"
    output_dir = args.output_dir

    log(f"Starting scraping task for keyword: '{keyword}' inside topic: '{topic}'")
    log(f"Target sources: {sources_list} (limit: {limit} items per source)")
    
    consolidated_data = []

    # Itération et déclenchement séquentiel des scrapers demandés
    for source in sources_list:
        log(f"Launching scraper for: {source.upper()}...")
        
        if source == "reddit":
            scraper = RedditScraper(keyword, topic, limit, use_mock)
            data = scraper.scrape()
            consolidated_data.extend(data)
            log(f"Reddit scraping finished. Found {len(data)} items.")
            
        elif source == "twitter" or source == "twitter/x" or source == "x":
            scraper = TwitterScraper(keyword, topic, limit, use_mock)
            data = scraper.scrape()
            consolidated_data.extend(data)
            log(f"Twitter/X scraping finished. Found {len(data)} items.")
            
        elif source == "news":
            scraper = NewsScraper(keyword, topic, limit, use_mock)
            data = scraper.scrape()
            consolidated_data.extend(data)
            log(f"News scraping finished. Found {len(data)} items.")
            
        else:
            log(f"Unknown source: '{source}'. Skipping.")

    # Sauvegarde consolidée de tous les résultats dans un fichier JSON unique
    os.makedirs(output_dir, exist_ok=True)
    filename = f"dataset_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(consolidated_data, f, ensure_ascii=False, indent=2)
        
    log(f"Successfully collected {len(consolidated_data)} total items.")
    # Marqueur spécial intercepté par le runner Node.js pour localiser le dataset
    log(f"DATASET_PATH:{filepath}")
    log("Task complete.")

if __name__ == "__main__":
    main()
