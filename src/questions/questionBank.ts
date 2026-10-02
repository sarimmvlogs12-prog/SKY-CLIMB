export type QuestionCategory =
  | "Platform"
  | "Wallet & Web3"
  | "$DLI Token"
  | "Staking & Economy"
  | "Roadmap";

export type QuestionDifficulty = "easy" | "normal" | "hard";

export interface Question {
  id: string;
  question: string;
  options: [string, string, string, string];
  /** index into options (options are re-shuffled each time a question is served) */
  correct: 0 | 1 | 2 | 3;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  explanation: string;
}

export const CATEGORIES: QuestionCategory[] = [
  "Platform",
  "Wallet & Web3",
  "$DLI Token",
  "Staking & Economy",
  "Roadmap",
];

/** Dlicom quiz. Append new questions here — nothing else needs to change. */
export const QUESTION_BANK: Question[] = [
  // ---------- EASY ----------
  { id: "e1", question: "Which blockchain is Dlicom built on?", options: ["Solana", "Base", "Polygon", "Avalanche"], correct: 1, category: "Platform", difficulty: "easy", explanation: "Dlicom is deployed on Base, an Ethereum Layer 2." },
  { id: "e2", question: "What is the native token of Dlicom called?", options: ["$DLC", "$DCM", "$DLI", "$DLX"], correct: 2, category: "$DLI Token", difficulty: "easy", explanation: "$DLI is Dlicom's native utility token." },
  { id: "e3", question: "What is the name of Dlicom's short vertical video feed?", options: ["DliReels", "DliShorts", "DliTok", "DliClips"], correct: 3, category: "Platform", difficulty: "easy", explanation: "DliClips is Dlicom's short-form video feed." },
  { id: "e4", question: "Which company incubated the Base network?", options: ["Coinbase", "Binance", "Kraken", "OpenSea"], correct: 0, category: "Wallet & Web3", difficulty: "easy", explanation: "Base is an Ethereum L2 incubated by Coinbase." },
  { id: "e5", question: "What kind of wallet does every Dlicom account get?", options: ["Custodial exchange wallet", "Paper wallet", "Self-custodial Web3 wallet", "Bank account"], correct: 2, category: "Wallet & Web3", difficulty: "easy", explanation: "Users hold their own private keys in a self-custodial wallet." },
  { id: "e6", question: "Dlicom is designed primarily as a…", options: ["Desktop-first app", "Mobile-first app", "Smart TV app", "Console game"], correct: 1, category: "Platform", difficulty: "easy", explanation: "Dlicom is a mobile-first application on iOS and Android." },
  { id: "e7", question: "Which stablecoin do $DLI stakers earn?", options: ["USDT", "USDC", "DAI", "BUSD"], correct: 0, category: "Staking & Economy", difficulty: "easy", explanation: "Staking for Revenue pays stakers in USDT." },
  { id: "e8", question: "Direct messages on Dlicom are…", options: ["Public to everyone", "End-to-end encrypted by default", "Only for premium users", "Deleted after 1 hour"], correct: 1, category: "Platform", difficulty: "easy", explanation: "E2E encryption is the baseline for every user." },
  { id: "e9", question: "Which token standard is $DLI?", options: ["ERC-721", "BEP-20", "SPL", "ERC-20"], correct: 3, category: "$DLI Token", difficulty: "easy", explanation: "$DLI is an ERC-20 token on Base." },
  { id: "e10", question: "What lets viewers send value to creators on Dlicom?", options: ["In-app tipping", "Bank transfer", "Gift cards", "Paid ads"], correct: 0, category: "Platform", difficulty: "easy", explanation: "In-app tipping sends crypto directly to creators." },
  { id: "e11", question: "Which language got full right-to-left support in V2.1.0?", options: ["Hindi", "Arabic", "Spanish", "Chinese"], correct: 1, category: "Platform", difficulty: "easy", explanation: "Arabic with RTL UI was added for the MENA community." },
  { id: "e12", question: "Where can users open dApps without leaving Dlicom?", options: ["Help Center", "DliClips", "In-app Web3 browser", "Stories bar"], correct: 2, category: "Wallet & Web3", difficulty: "easy", explanation: "The built-in Web3 browser connects to any dApp." },
  { id: "e13", question: "Can new $DLI tokens be minted in future?", options: ["Yes, every year", "Only by the team", "Only by DAO vote", "No, supply is fixed forever"], correct: 3, category: "$DLI Token", difficulty: "easy", explanation: "The supply is permanently capped — no new minting." },
  { id: "e14", question: "Who founded Dlicom and wrote its Manifesto?", options: ["Mohammad Qadriya", "Vitalik Buterin", "Brian Armstrong", "Satoshi Nakamoto"], correct: 0, category: "Platform", difficulty: "easy", explanation: "Founder Mohammad Qadriya wrote the Dlicom Manifesto." },

  // ---------- NORMAL ----------
  { id: "n1", question: "What is the total supply of $DLI?", options: ["100,000,000", "210,000,000", "355,000,000", "1,000,000,000"], correct: 2, category: "$DLI Token", difficulty: "normal", explanation: "Fixed total supply: 355,000,000 $DLI." },
  { id: "n2", question: "Which firm audited the $DLI smart contract?", options: ["CertiK", "Hacken", "OpenZeppelin", "Trail of Bits"], correct: 1, category: "$DLI Token", difficulty: "normal", explanation: "The contract was independently audited by Hacken." },
  { id: "n3", question: "What does SFR stand for?", options: ["Social Feed Rewards", "Secure Fund Reserve", "Smart Fee Router", "Staking for Revenue"], correct: 3, category: "Staking & Economy", difficulty: "normal", explanation: "SFR = Staking for Revenue." },
  { id: "n4", question: "How often are SFR USDT rewards distributed?", options: ["Every hour", "Every day", "Every week", "Every month"], correct: 0, category: "Staking & Economy", difficulty: "normal", explanation: "USDT is distributed on-chain every hour." },
  { id: "n5", question: "What is the $DLI presale price?", options: ["$0.01", "$0.05", "$0.10", "$0.50"], correct: 1, category: "$DLI Token", difficulty: "normal", explanation: "Presale and launch price are both $0.05." },
  { id: "n6", question: "In which version was DliClips introduced?", options: ["V1.0", "V2.0", "V2.1.0", "V3.0"], correct: 2, category: "Platform", difficulty: "normal", explanation: "DliClips arrived in V2.1.0." },
  { id: "n7", question: "When is the $DLI Token Generation Event (TGE)?", options: ["2024", "2025", "2026", "2027"], correct: 3, category: "$DLI Token", difficulty: "normal", explanation: "TGE is scheduled for 2027." },
  { id: "n8", question: "What new admin tool did communities get in V2.1.0?", options: ["Restrict posting to admins only", "Paid entry fees", "Auto-ban bots", "Video calls"], correct: 0, category: "Platform", difficulty: "normal", explanation: "Admins can limit posting to admins and delete violating posts." },
  { id: "n9", question: "Which category gets the largest $DLI allocation?", options: ["Liquidity", "Network Sale", "Team", "Public Sale"], correct: 1, category: "$DLI Token", difficulty: "normal", explanation: "Network Sale holds 148.5M $DLI (41.8%)." },
  { id: "n10", question: "What happens if you unstake $DLI early?", options: ["Nothing", "You lose all rewards only", "2% of the staked amount is burned", "Your account is frozen"], correct: 2, category: "Staking & Economy", difficulty: "normal", explanation: "Early unstaking burns 2% of the staked tokens." },
  { id: "n11", question: "Where was Dlicom's first community event held (2024)?", options: ["Istanbul", "London", "Singapore", "Dubai"], correct: 3, category: "Roadmap", difficulty: "normal", explanation: "The first community event was in Dubai." },
  { id: "n12", question: "Which country hosted the 2025 community event?", options: ["Turkey", "UAE", "Pakistan", "Egypt"], correct: 0, category: "Roadmap", difficulty: "normal", explanation: "The 2025 event took place in Turkey." },
  { id: "n13", question: "What can $DLI holders do in DAO governance?", options: ["Mint tokens", "Vote, weighted by holdings", "Freeze other wallets", "Edit the audit"], correct: 1, category: "Staking & Economy", difficulty: "normal", explanation: "Voting weight is proportional to $DLI holdings." },
  { id: "n14", question: "Why was Base chosen for Dlicom?", options: ["It has no smart contracts", "It is owned by Dlicom", "Low fees and full EVM compatibility", "It only supports NFTs"], correct: 2, category: "Wallet & Web3", difficulty: "normal", explanation: "Low costs make tips and votes practical at scale." },
  { id: "n15", question: "Which compliance approach does the Dlicom wallet follow?", options: ["Shariah-compliant mechanics", "Casino licensing", "Margin trading rules", "None"], correct: 0, category: "Wallet & Web3", difficulty: "normal", explanation: "The wallet is Shariah-compliant in its mechanics." },

  // ---------- HARD ----------
  { id: "h1", question: "SFR hourly rewards = USDT in the staking contract divided by…", options: ["100", "1000", "1500", "3550"], correct: 2, category: "Staking & Economy", difficulty: "hard", explanation: "The formula is contract USDT ÷ 1500, shared among stakers." },
  { id: "h2", question: "What is the initial circulating supply at TGE?", options: ["53,250,000", "82,125,000", "148,500,000", "50,000,000"], correct: 1, category: "$DLI Token", difficulty: "hard", explanation: "82,125,000 $DLI circulate at TGE." },
  { id: "h3", question: "What percentage of supply goes to Liquidity?", options: ["5%", "14.1%", "3%", "15%"], correct: 3, category: "$DLI Token", difficulty: "hard", explanation: "Liquidity: 53,250,000 $DLI = 15.0%." },
  { id: "h4", question: "What is the approximate fully diluted valuation (FDV)?", options: ["~$17.75M", "~$4.1M", "~$2.5M", "~$35.5M"], correct: 0, category: "$DLI Token", difficulty: "hard", explanation: "355M × $0.05 ≈ $17.75M FDV." },
  { id: "h5", question: "Presale tokens vest over how long after TGE?", options: ["3 months", "6 months", "12 months", "24 months"], correct: 2, category: "$DLI Token", difficulty: "hard", explanation: "Distributed monthly over 12 months from TGE." },
  { id: "h6", question: "How many tokens are allocated to the Team?", options: ["17,750,000", "3,550,000", "53,250,000", "10,650,000"], correct: 3, category: "$DLI Token", difficulty: "hard", explanation: "Team: 10,650,000 $DLI (3.0%)." },
  { id: "h7", question: "What share of supply goes to Treasury & Reserve?", options: ["1%", "5%", "3%", "15%"], correct: 1, category: "$DLI Token", difficulty: "hard", explanation: "Treasury & Reserve: 17,750,000 $DLI = 5%." },
  { id: "h8", question: "The Hacken audit was launched in which roadmap quarter?", options: ["Q1 2026", "Q4 2025", "Q2 2026", "Q3 2026"], correct: 0, category: "Roadmap", difficulty: "hard", explanation: "Hacken audit is listed in Q1 2026." },
  { id: "h9", question: "When does SFR utility go live per the roadmap?", options: ["Q1 2026", "Q3 2026", "Q2 2026", "Q4 2026"], correct: 2, category: "Roadmap", difficulty: "hard", explanation: "SFR utility goes live in Q2 2026." },
  { id: "h10", question: "Which is planned for Q4 2026?", options: ["DliClips launch", "Personalized AI feeds", "Dlicom beta", "Browser extension"], correct: 1, category: "Roadmap", difficulty: "hard", explanation: "Q4 2026 includes AI feeds, mini apps and premium users." },
  { id: "h11", question: "Roughly how much is the initial liquidity?", options: ["~$1M", "~$4.1M", "~$10M", "~$2.5M"], correct: 3, category: "$DLI Token", difficulty: "hard", explanation: "Initial liquidity is about $2.5M." },
  { id: "h12", question: "How many organic app downloads were reached in 2025?", options: ["10,000+", "5,000+", "20,000+", "50,000+"], correct: 0, category: "Roadmap", difficulty: "hard", explanation: "2025: 10,000+ downloads and 20,000+ wallets created." },
  { id: "h13", question: "What does the web platform currently support for presale buyers?", options: ["DliClips upload", "Encrypted calls", "SFR staking", "NFT minting"], correct: 2, category: "Staking & Economy", difficulty: "hard", explanation: "The web app currently supports SFR staking for presale buyers." },
  { id: "h14", question: "How many tokens go to Advisory?", options: ["10,650,000", "3,550,000", "1,000,000", "17,750,000"], correct: 1, category: "$DLI Token", difficulty: "hard", explanation: "Advisory: 3,550,000 $DLI (1.0%)." },
  { id: "h15", question: "Tipping on Dlicom works with which coins?", options: ["Only $DLI", "Only USDT", "Only ETH", "Any EVM-compatible coin"], correct: 3, category: "Wallet & Web3", difficulty: "hard", explanation: "EVM tipping accepts any EVM-compatible coin." },
];
