import pandas as pd
import os

new_english_samples = [
    # SME / UMKM English samples
    ("I have a small local bakery and need a simple and cheap POS cashier application.", "SME", "Custom Software Development"),
    ("We are a small startup business looking for an affordable website for online sales.", "SME", "Custom Software Development"),
    ("How much is a low-budget landing page for my home-based craft shop?", "SME", "Custom Software Development"),
    ("Need IT advice for a small family-owned grocery store to manage inventory simply.", "SME", "IT Strategy Consulting"),
    ("Simple website design for small local coffee shop with online ordering menu.", "SME", "Custom Software Development"),
    ("Looking for cheap cloud hosting for our small business online catalog.", "SME", "Cloud Infrastructure & Migration"),
    ("We are a micro business owner and need basic cybersecurity check for our small store.", "SME", "Cybersecurity Audit"),
    ("Can you build a simple mobile app for our local laundry delivery service on a tight budget?", "SME", "Custom Software Development"),
    ("Affordable IT solutions and basic website setup for rural community entrepreneurs.", "SME", "IT Strategy Consulting"),
    ("Small fashion retail shop needs easy-to-use billing software and WhatsApp order integration.", "SME", "Custom Software Development"),
    ("I want to digitize my small food kiosk with a tablet cashier system.", "SME", "Custom Software Development"),
    ("Cheap domain setup and simple email system for independent consultant.", "SME", "Cloud Infrastructure & Migration"),
    ("Budget-friendly e-commerce store for handmade jewelry startup.", "SME", "Custom Software Development"),
    ("How to protect our small online shop from basic cyber attacks without spending too much?", "SME", "Cybersecurity Audit"),
    ("Digital marketing strategy and simple website setup for local handicraft SME.", "SME", "IT Strategy Consulting"),
    ("Small repair workshop needs lightweight inventory tracking app on Android phone.", "SME", "Custom Software Development"),
    ("Looking for affordable web development package for small flower shop.", "SME", "Custom Software Development"),
    ("We are a beginner team of 3 people needing simple tools to track daily sales.", "SME", "Custom Software Development"),
    ("Easy Excel to cloud data migration for small family business records.", "SME", "Cloud Infrastructure & Migration"),
    ("Need quick consultation on how to start online selling for small traditional merchant.", "SME", "IT Strategy Consulting"),

    # Corporate English samples
    ("We want to build an enterprise asset management system integrated with procurement. This is a 5-year strategic plan for our company.", "Corporate", "Custom Software Development"),
    ("Our multinational corporation requires SAP ERP migration and integration for 1000 employees across global branches.", "Corporate", "Custom Software Development"),
    ("Request for Proposal (RFP) for enterprise cloud infrastructure migration to AWS with strict SLA 99.99% uptime.", "Corporate", "Cloud Infrastructure & Migration"),
    ("Comprehensive cybersecurity penetration testing and ISO 27001 readiness audit for financial enterprise.", "Corporate", "Cybersecurity Audit"),
    ("We are a manufacturing conglomerate looking for custom supply chain software and vendor procurement portal.", "Corporate", "Custom Software Development"),
    ("Enterprise architecture consulting (TOGAF) and 5-year IT strategic roadmap for publicly listed holding company.", "Corporate", "IT Strategy Consulting"),
    ("Development of high-throughput microservices architecture and Kubernetes deployment for banking platform.", "Corporate", "Custom Software Development"),
    ("Corporate internal procurement system modernization and CRM integration for 500+ corporate staff.", "Corporate", "Custom Software Development"),
    ("Our company needs a dedicated engineering team of 25 developers for long-term enterprise software revamp.", "Corporate", "Custom Software Development"),
    ("Enterprise data analytics dashboard and automated financial reporting system for Board of Directors.", "Corporate", "Custom Software Development"),
    ("Zero Trust Network Access (ZTNA) and 24/7 SIEM monitoring implementation for corporate security operations.", "Corporate", "Cybersecurity Audit"),
    ("Migration of core banking databases across multi-region data centers with zero operational downtime.", "Corporate", "Cloud Infrastructure & Migration"),
    ("Strategic assessment of AI adoption ROI and big data infrastructure for multinational insurance firm.", "Corporate", "IT Strategy Consulting"),
    ("Custom B2B vendor portal with OAuth2 security standards for enterprise retail group.", "Corporate", "Custom Software Development"),
    ("Enterprise SharePoint and Microsoft 365 licensing setup and workflow automation for corporate headquarters.", "Corporate", "Cloud Infrastructure & Migration"),
    ("Disaster Recovery Management and business continuity planning for telecommunications enterprise.", "Corporate", "Cybersecurity Audit"),
    ("We need external red team simulation and vulnerability assessment for our corporate payment gateway.", "Corporate", "Cybersecurity Audit"),
    ("Corporate procurement digitization and internal supply chain management roadmap.", "Corporate", "IT Strategy Consulting"),
    ("Business process re-engineering and cloud native transformation for industrial manufacturing conglomerate.", "Corporate", "IT Strategy Consulting"),
    ("Continuous integration and DevSecOps pipeline setup for enterprise development division.", "Corporate", "Cloud Infrastructure & Migration"),

    # Government English samples
    ("Our government ministry is preparing a 5-year strategic plan for public service digital transformation and state procurement.", "Government", "Government Solutions"),
    ("National agency requires e-government portal development and citizen identity management integration.", "Government", "Government Solutions"),
    ("Municipality smart city master plan and public traffic monitoring system implementation.", "Government", "Government Solutions"),
    ("Cybersecurity compliance audit for public health database according to national data protection standards.", "Government", "Cybersecurity Audit"),
    ("Public procurement tracking dashboard and transparent national state budget monitoring portal.", "Government", "Government Solutions"),
    ("Migration of state department servers to national secure government cloud infrastructure.", "Government", "Cloud Infrastructure & Migration"),
    ("Development of citizen grievance reporting mobile app for city government administration.", "Government", "Government Solutions"),
    ("Digitalization of municipal tax and public land registry system for regional department.", "Government", "Government Solutions"),
    ("Strategic IT roadmap and e-governance architecture consulting for public educational institution.", "Government", "IT Strategy Consulting"),
    ("Government agency requires custom public welfare distribution tracking system to ensure accountability.", "Government", "Government Solutions"),
    ("Vulnerability assessment of official ministry websites following public cybersecurity threats.", "Government", "Cybersecurity Audit"),
    ("Smart village initiative software platform for rural municipality connectivity and administrative services.", "Government", "Government Solutions"),
    ("Public safety and emergency response command center software for regional authorities.", "Government", "Government Solutions"),
    ("Implementation of national government service bus for interoperability between public departments.", "Government", "Government Solutions"),
    ("Cybersecurity training and awareness programs for civil servants across government ministries.", "Government", "IT Strategy Consulting"),
    ("Electronic public bidding and state tender management portal (e-procurement) for public sector.", "Government", "Government Solutions"),
    ("Regional hospital network management and digital medical records system for public healthcare.", "Government", "Government Solutions"),
    ("GIS mapping application for public urban planning and regional zoning department.", "Government", "Government Solutions"),
    ("Disaster management and early warning notification platform for national disaster agency.", "Government", "Government Solutions"),
    ("Public library digital archiving system and electronic records management for state ministry.", "Government", "Government Solutions")
]

def append_english_samples():
    csv_path = os.path.join('data', 'dataset.csv')
    df_existing = pd.read_csv(csv_path)
    
    df_new = pd.DataFrame(new_english_samples, columns=['text', 'label', 'service'])
    
    existing_texts = set(df_existing['text'].str.strip())
    df_new_filtered = df_new[~df_new['text'].str.strip().isin(existing_texts)]
    
    df_combined = pd.concat([df_existing, df_new_filtered], ignore_index=True)
    df_combined.to_csv(csv_path, index=False)
    print(f"Added {len(df_new_filtered)} new bilingual English samples. Total dataset size: {len(df_combined)} samples.")
    print(df_combined['label'].value_counts())

if __name__ == '__main__':
    append_english_samples()
