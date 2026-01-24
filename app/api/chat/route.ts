import { NextResponse } from 'next/server';

/**
 * AI Chat API
 * 
 * Provides intelligent chat responses using pattern matching and context awareness.
 * For production, integrate with AI services like OpenAI GPT, Anthropic Claude,
 * or Google Gemini for more sophisticated natural language understanding.
 */

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface ChatRequest {
  message: string;
  language: 'en' | 'am' | 'om';
  history?: Message[];
}

// Enhanced knowledge base with more detailed responses
const knowledgeBase = {
  en: [
    {
      keywords: ['vendor', 'seller', 'become', 'register', 'sell', 'merchant'],
      response: 'To become a vendor on Minalesh:\n\n1. Create an account or log in\n2. Go to your Dashboard\n3. Complete your profile with business details\n4. Provide Trade License and TIN Number\n5. Wait for admin approval (typically 1-2 business days)\n6. Start listing your products!\n\n📦 Benefits of selling on Minalesh:\n• Access to millions of Ethiopian customers\n• Built-in payment processing\n• Marketing and promotional tools\n• Real-time analytics dashboard\n• Low commission rates\n\nNeed help? Contact vendor support at support@minalesh.com'
    },
    {
      keywords: ['ar', 'augmented', 'reality', 'try', 'tryon', 'virtual', '3d'],
      response: 'AR Try-On is available for select products like sunglasses, caps, and some accessories!\n\n✨ Features:\n• See how products look on you in real-time\n• Try different angles and positions\n• Make confident purchase decisions\n• Works with your device camera\n\n🔍 How to use:\n1. Look for the "AR View" badge on product pages\n2. Click to activate camera\n3. Allow camera permissions\n4. Try on the product virtually!\n\nNote: AR features work best on mobile devices with camera access.'
    },
    {
      keywords: ['payment', 'pay', 'checkout', 'card', 'mobile', 'money', 'telebirr', 'cbe'],
      response: 'We accept multiple payment methods:\n\n💳 Credit/Debit Cards:\n• Visa, Mastercard, American Express\n• Secure encryption and PCI compliance\n\n📱 Mobile Money:\n• TeleBirr\n• CBE Birr\n• M-Pesa\n• HelloCash\n\n💵 Cash on Delivery (COD):\n• Available in Addis Ababa, Dire Dawa, Mekelle, and Bahir Dar\n• Pay when you receive your order\n\n🏦 Bank Transfer:\n• All major Ethiopian banks supported\n\nAll transactions are secured with bank-grade encryption. Your payment information is never stored on our servers.'
    },
    {
      keywords: ['shipping', 'delivery', 'ship', 'send', 'transport', 'courier'],
      response: 'Shipping Information:\n\n📦 Free Shipping:\n• Orders over 500 ETB qualify for free shipping nationwide\n\n⏱️ Delivery Times:\n• Standard: 3-5 business days\n• Express: 1-2 business days (additional charge)\n• Same-day: Available in Addis Ababa for orders before 2 PM\n\n🗺️ Coverage:\n• Nationwide delivery to all Ethiopian cities\n• Remote areas may require additional 1-2 days\n\n📍 Tracking:\n• Real-time tracking via SMS and email\n• Track in your Dashboard > Orders\n• Receive notifications at each step\n\nQuestions about your shipment? Contact shipping@minalesh.com'
    },
    {
      keywords: ['return', 'refund', 'exchange', 'cancel', 'warranty'],
      response: 'Returns & Refunds Policy:\n\n✅ Return Window:\n• 7 days for most items\n• 14 days for electronics\n• 30 days for defective products\n\n📋 Conditions:\n• Items must be unused and in original packaging\n• Include all accessories and documentation\n• No returns on intimate apparel or perishables\n\n💰 Refund Process:\n1. Go to Dashboard > Orders\n2. Select "Request Return"\n3. Choose reason and upload photos if applicable\n4. Get approval within 24 hours\n5. Refund processed within 5-7 business days\n\n🔄 Exchanges:\n• Free exchanges for wrong/defective items\n• Size exchanges available for clothing\n\nContact returns@minalesh.com for assistance.'
    },
    {
      keywords: ['track', 'order', 'status', 'where', 'tracking', 'location'],
      response: 'Track Your Order:\n\n📱 Method 1 - Dashboard:\n1. Log in to your account\n2. Go to Dashboard > Orders\n3. Click on your order number\n4. View real-time tracking map and status\n\n📧 Method 2 - Email/SMS:\n• Use the tracking link sent to you\n• Enter your order number and email\n\n📍 Order Statuses:\n• Order Confirmed - We\'ve received your order\n• Processing - Being prepared for shipment\n• Shipped - On the way to you\n• Out for Delivery - Arriving today\n• Delivered - Successfully received\n\n❓ Issues with tracking? Contact support@minalesh.com with your order number.'
    },
    {
      keywords: ['account', 'profile', 'login', 'password', 'forgot', 'reset', 'username'],
      response: 'Account Management:\n\n🔐 Forgot Password:\n1. Click "Forgot Password" on login page\n2. Enter your email address\n3. Check email for reset link (valid 1 hour)\n4. Create new password\n\n👤 Update Profile:\n• Dashboard > Profile Settings\n• Update name, phone, address\n• Add profile picture\n• Manage email preferences\n\n🔒 Security:\n• Change password: Profile Settings > Security\n• Enable two-factor authentication (recommended)\n• Review active sessions\n• View login history\n\n❌ Delete Account:\n• Profile Settings > Privacy > Delete Account\n• Your data will be permanently removed\n\nNeed help? Contact support@minalesh.com'
    },
    {
      keywords: ['price', 'cost', 'expensive', 'cheap', 'discount', 'sale', 'offer', 'coupon'],
      response: 'Pricing & Promotions:\n\n💰 Best Deals:\n• Daily Deals - Up to 50% off selected items\n• Flash Sales - Limited time offers\n• Seasonal Sales - Holiday discounts\n• Vendor Promotions - Direct from sellers\n\n🎫 Coupon Codes:\n• Enter at checkout for instant savings\n• Stack multiple coupons when allowed\n• Subscribe to newsletter for exclusive codes\n\n📦 Bulk Discounts:\n• Save more when you buy in quantity\n• Great for businesses and resellers\n\n🔔 Price Alerts:\n• Add items to wishlist\n• Get notified when prices drop\n• Never miss a deal!\n\nTip: Follow us on social media for flash sale announcements!'
    },
    {
      keywords: ['contact', 'support', 'help', 'customer service', 'phone', 'email', 'chat'],
      response: 'Contact Customer Support:\n\n💬 Live Chat:\n• Available 24/7 right here in this chat!\n• Fastest response for urgent questions\n\n📧 Email Support:\n• support@minalesh.com\n• Response within 24 hours\n• Attach screenshots for faster resolution\n\n📞 Phone Support:\n• +251-11-XXX-XXXX (Addis Ababa)\n• Monday-Friday: 8 AM - 8 PM\n• Saturday: 9 AM - 5 PM\n\n🏢 Office Visit:\n• Bole, Addis Ababa\n• Monday-Friday: 9 AM - 6 PM\n• Please call ahead to schedule\n\n📱 Social Media:\n• Facebook: @MinaleshMarket\n• Twitter: @MinaleshET\n• Instagram: @minalesh.ethiopia\n\nEmergency? Use the chat for immediate assistance!'
    },
    {
      keywords: ['wishlist', 'favorite', 'save', 'bookmark'],
      response: 'Wishlist Features:\n\n❤️ Add to Wishlist:\n• Click the heart icon on any product\n• Save items for later\n• Share your wishlist with friends\n\n🔔 Benefits:\n• Get price drop notifications\n• Receive back-in-stock alerts\n• Create multiple wishlists (Wedding, Birthday, etc.)\n• Access from any device\n\n📤 Share:\n• Share your wishlist via link\n• Perfect for gift registries\n• Friends can see what you want\n\nFind your wishlist in Dashboard > Wishlist'
    },
    {
      keywords: ['review', 'rating', 'feedback', 'comment'],
      response: 'Product Reviews & Ratings:\n\n⭐ Leave a Review:\n1. Purchase the product\n2. Go to Dashboard > Orders\n3. Click "Write Review" on delivered items\n4. Rate and share your experience\n\n✍️ What to Include:\n• Product quality and accuracy\n• Shipping experience\n• Photos or videos (helpful!)\n• Honest feedback\n\n🎁 Rewards:\n• Earn points for detailed reviews\n• Help other shoppers make decisions\n• Top reviewers get badges\n\n📊 Trust:\n• Only verified purchases can review\n• Reviews moderated for authenticity\n• Vendors can respond to feedback'
    },
    {
      keywords: ['categories', 'browse', 'products', 'items', 'catalog'],
      response: 'Browse Our Catalog:\n\n🏷️ Popular Categories:\n• Electronics & Gadgets\n• Fashion & Clothing\n• Home & Garden\n• Beauty & Personal Care\n• Sports & Outdoors\n• Books & Stationery\n• Traditional Ethiopian Items\n\n🔍 Browse Tips:\n• Use filters to narrow results\n• Sort by price, popularity, or newest\n• Check vendor ratings\n• Read customer reviews\n\n✨ Featured:\n• New Arrivals - Latest products\n• Trending - Most popular items\n• Top Rated - Highest customer satisfaction\n\nDiscover more at minalesh.com/categories'
    },
    {
      keywords: ['warranty', 'guarantee', 'defect', 'damage'],
      response: 'Warranty & Guarantees:\n\n✅ Product Warranty:\n• Electronics: 1-year manufacturer warranty\n• Appliances: 6-month warranty\n• Other items: Varies by product and vendor\n\n🛡️ Minalesh Guarantee:\n• Authentic products only\n• Money-back if item not as described\n• Free return shipping for defective items\n• Protection against counterfeit goods\n\n⚠️ Report Defects:\n1. Contact us within 7 days of delivery\n2. Provide photos/video of defect\n3. Get approval for return or replacement\n4. Choose refund or exchange\n\n📝 Keep:\n• Original packaging\n• Warranty card\n• Purchase receipt\n\nWarranty questions? Contact warranty@minalesh.com'
    },
    {
      keywords: ['language', 'amharic', 'oromo', 'translate', 'አማርኛ', 'oromoo'],
      response: 'Language Support:\n\n🌍 Available Languages:\n• English (EN)\n• አማርኛ (Amharic - AM)\n• Afaan Oromoo (Oromo - OM)\n\n🔄 How to Switch:\n• Click the language icon (🌐) in the top menu\n• Select your preferred language\n• All content updates automatically\n• Your preference is saved\n\n💬 Chat Support:\n• This AI helper supports all 3 languages\n• Simply ask questions in your language\n• Get responses in the same language\n\n📱 Note: Some product descriptions may only be available in English. We\'re working to translate all content!'
    },
    {
      keywords: ['security', 'safe', 'scam', 'fraud', 'privacy', 'data'],
      response: 'Security & Privacy:\n\n🔒 We Protect Your Data:\n• Bank-grade encryption (SSL/TLS)\n• PCI DSS compliant payment processing\n• No storage of card details\n• Regular security audits\n\n🛡️ Safe Shopping:\n• Verified vendors only\n• Buyer protection program\n• Secure checkout process\n• Fraud detection system\n\n👤 Your Privacy:\n• GDPR compliant\n• No selling of personal data\n• Export your data anytime\n• Delete account option available\n\n⚠️ Report Suspicious Activity:\n• Unusual vendor behavior\n• Suspected counterfeit items\n• Phishing attempts\n• Email: security@minalesh.com\n\nStay safe: Never share passwords or pay outside the platform!'
    },
    {
      keywords: ['app', 'mobile', 'ios', 'android', 'download'],
      response: 'Mobile Apps:\n\n📱 Coming Soon!\nWe\'re currently developing mobile apps for:\n• iOS (iPhone/iPad)\n• Android devices\n\n🌐 Meanwhile:\n• Use our mobile-optimized website\n• Works great on all devices\n• Add to home screen for app-like experience\n\n🔔 Get Notified:\n• Subscribe to our newsletter\n• Follow us on social media\n• Be first to know when apps launch\n\nThe mobile website has all features: shopping, tracking, AR try-on, and more!'
    }
  ],
  am: [
    {
      keywords: ['ሻጭ', 'መሆን', 'መሸጥ', 'ስራ', 'ነጋዴ', 'መመዝገብ'],
      response: 'በሚናሌሽ ሻጭ ለመሆን:\n\n1. መለያ ይፍጠሩ ወይም ይግቡ\n2. ወደ ዳሽቦርድዎ ይሂዱ\n3. የንግድ ዝርዝሮችዎን ያጠናቅቁ\n4. የንግድ ፈቃድ እና ቲን ቁጥር ያቅርቡ\n5. የአስተዳዳሪ ፈቃድ ይጠብቁ (በተለምዶ 1-2 የስራ ቀናት)\n6. ምርቶችዎን ማዘዝዘት ይጀምሩ!\n\n📦 በሚናሌሽ መሸጥ ጥቅሞች:\n• በሚሊዮኖች የሚቆጠሩ የኢትዮጵያ ደንበኞችን ያግኙ\n• የተዋሃደ የክፍያ አሰራር\n• የግብይት እና የማስተዋወቂያ መሳሪያዎች\n• የእውነተኛ ጊዜ የትንታኔ ዳሽቦርድ\n• ዝቅተኛ የኮሚሽን ተመኖች\n\nእገዛ ይፈልጋሉ? የሻጭ ድጋፍን በ support@minalesh.com ያነጋግሩ'
    },
    {
      keywords: ['AR', 'ሙከራ', 'ምናባዊ', 'መስታወት', 'ባህሪ', '3D'],
      response: 'AR ሙከራ እንደ መነጽሮች፣ ኮፍያዎች እና አንዳንድ መለዋወጫዎች ላይ ይገኛል!\n\n✨ ባህሪያት:\n• ምርቶች በእርስዎ ላይ በእውነተኛ ጊዜ እንዴት እንደሚመስሉ ይመልከቱ\n• የተለያዩ አቅጣጫዎችን እና አቀማመጦችን ይሞክሩ\n• በራስ የሚጣር የግዢ ውሳኔዎችን ያድርጉ\n• ከመሳሪያዎ ካሜራ ጋር ይሰራል\n\n🔍 እንዴት ጥቅም ላይ ይውላል:\n1. በምርት ገጾች ላይ "AR View" ምልክቱን ያግኙ\n2. ካሜራን ለማንቃት ጠቅ ያድርጉ\n3. የካሜራ ፈቃዶችን ይፍቀዱ\n4. ምርቱን በምናባዊ መንገድ ይሞክሩ!\n\nማስታወሻ: AR ባህሪያት በካሜራ መዳረሻ ባላቸው ሞባይል መሳሪያዎች በተሻለ ይሰራሉ።'
    },
    {
      keywords: ['ክፍያ', 'ለመክፈል', 'ካርድ', 'ገንዘብ', 'ቴሌብር', 'ሲቢኢ'],
      response: 'በርካታ የክፍያ መንገዶችን እንቀበላለን:\n\n💳 ክሬዲት/ዴቢት ካርዶች:\n• ቪዛ፣ ማስተርካርድ፣ አሜሪካን ኤክስፕረስ\n• ደህንነቱ የተጠበቀ ማመስጠር እና PCI ተገዢነት\n\n📱 የሞባይል ገንዘብ:\n• ቴሌብር\n• ሲቢኢ ብር\n• ኤም-ፔሳ\n• ሄሎካሽ\n\n💵 በምርቱ ደርሶ መክፈል (COD):\n• በአዲስ አበባ፣ ድሬዳዋ፣ መቐለ እና ባሕር ዳር ይገኛል\n• ትዕዛዝዎን ሲቀበሉ ይክፈሉ\n\n🏦 የባንክ ዝውውር:\n• ሁሉም ዋና የኢትዮጵያ ባንኮች ይደገፋሉ\n\nሁሉም ግብይቶች በባንክ ደረጃ ማመስጠር የተጠበቁ ናቸው። የክፍያ መረጃዎ በአገልጋዮቻችን ላይ በጭራሽ አይቀመጥም።'
    },
    {
      keywords: ['ማድረስ', 'መላክ', 'ማጓጓዝ', 'ኩሪየር'],
      response: 'የማድረስ መረጃ:\n\n📦 ነፃ ማድረስ:\n• ከ500 ብር በላይ ትዕዛዞች በመላ አገር ነፃ ማድረስ ያገኛሉ\n\n⏱️ የማድረስ ጊዜዎች:\n• መደበኛ: 3-5 የስራ ቀናት\n• ፈጣን: 1-2 የስራ ቀናት (ተጨማሪ ክፍያ)\n• በተመሳሳይ ቀን: በአዲስ አበባ ከቀኑ 2 ሰዓት በፊት ለተደረጉ ትዕዛዞች ይገኛል\n\n🗺️ ሽፋን:\n• ወደ ሁሉም የኢትዮጵያ ከተሞች በመላ አገር ማድረስ\n• ሩቅ አካባቢዎች ተጨማሪ 1-2 ቀናት ሊፈልጉ ይችላሉ\n\n📍 መከታተል:\n• በኤስኤምኤስ እና በኢሜይል የእውነተኛ ጊዜ ክትትል\n• በዳሽቦርድዎ > ትዕዛዞች ይከታተሉ\n• በእያንዳንዱ ደረጃ ማሳወቂያዎችን ይቀበሉ\n\nስለመላኪያዎ ጥያቄዎች አሉዎት? shipping@minalesh.com ያነጋግሩ'
    },
    {
      keywords: ['መመለስ', 'ተመላሽ', 'መለወጥ', 'መሰረዝ', 'ዋስትና'],
      response: 'የመመለሻ እና የገንዘብ ተመላሽ ፖሊሲ:\n\n✅ የመመለሻ መስኮት:\n• ለአብዛኛዎቹ እቃዎች 7 ቀናት\n• ለኤሌክትሮኒክስ 14 ቀናት\n• ለጉድለት ያላቸው ምርቶች 30 ቀናት\n\n📋 ሁኔታዎች:\n• እቃዎች ያልተጠቀሙ እና በዋናው ማሸጊያ ውስጥ መሆን አለባቸው\n• ሁሉንም መለዋወጫዎች እና ሰነዶች ያካትቱ\n• በቅርበት የሚለበሱ ልብሶች ወይም የሚበላሹ ምርቶች ላይ መመለስ የለም\n\n💰 የገንዘብ ተመላሽ ሂደት:\n1. ወደ ዳሽቦርድ > ትዕዛዞች ይሂዱ\n2. "መመለስ ጠይቅ" ይምረጡ\n3. ምክንያት ይምረጡ እና ፎቶዎችን ይስቀሉ\n4. በ24 ሰዓታት ውስጥ ፈቃድ ያግኙ\n5. የገንዘብ ተመላሽ በ5-7 የስራ ቀናት ውስጥ ይከናወናል\n\n🔄 ልውውጦች:\n• ለተሳሳቱ/ጉድለት ላላቸው እቃዎች ነፃ ልውውጥ\n• ለልብሶች የመጠን ልውውጥ ይገኛል\n\nለእገዛ returns@minalesh.com ያነጋግሩ።'
    },
    {
      keywords: ['መከታተል', 'ትዕዛዝ', 'ሁኔታ', 'የት', 'አገኛሁ', 'አካባቢ'],
      response: 'ትዕዛዝዎን ይከታተሉ:\n\n📱 ዘዴ 1 - ዳሽቦርድ:\n1. ወደ መለያዎ ይግቡ\n2. ወደ ዳሽቦርድ > ትዕዛዞች ይሂዱ\n3. በትዕዛዝ ቁጥርዎ ላይ ጠቅ ያድርጉ\n4. የእውነተኛ ጊዜ የክትትል ካርታ እና ሁኔታ ይመልከቱ\n\n📧 ዘዴ 2 - ኢሜይል/ኤስኤምኤስ:\n• ወደእርስዎ የተላከውን የክትትል አገናኝ ይጠቀሙ\n• የትዕዛዝ ቁጥርዎን እና ኢሜይልዎን ያስገቡ\n\n📍 የትዕዛዝ ሁኔታዎች:\n• ትዕዛዝ ተረጋግጧል - ትዕዛዝዎን ተቀብለናል\n• በሂደት ላይ - ለመላኪያ በዝግጅት ላይ\n• ተልኳል - ወደ እርስዎ በመንገድ ላይ\n• ለማድረስ ወጥቷል - ዛሬ ይደርሳል\n• ደርሷል - በተሳካ ሁኔታ ተቀብለዋል\n\n❓ በክትትል ላይ ችግሮች? በትዕዛዝ ቁጥርዎ support@minalesh.com ያነጋግሩ።'
    },
    {
      keywords: ['መለያ', 'መገለጫ', 'መግባት', 'የይለፍ ቃል', 'ረሳሁ', 'ዳግም ማስጀመር', 'ተጠቃሚ'],
      response: 'የመለያ አስተዳደር:\n\n🔐 የይለፍ ቃል ረስተዋል:\n1. በመግቢያ ገጽ ላይ "የይለፍ ቃል ረስተዋል" የሚለውን ጠቅ ያድርጉ\n2. የኢሜይል አድራሻዎን ያስገቡ\n3. ለዳግም ማስጀመሪያ አገናኝ ኢሜይል ይፈትሹ (ለ1 ሰዓት የሚሰራ)\n4. አዲስ የይለፍ ቃል ይፍጠሩ\n\n👤 መገለጫ ያዘምኑ:\n• ዳሽቦርድ > የመገለጫ ቅንብሮች\n• ስም፣ ስልክ፣ አድራሻ ያዘምኑ\n• የመገለጫ ምስል ያክሉ\n• የኢሜይል ምርጫዎችን ያስተዳድሩ\n\n🔒 ደህንነት:\n• የይለፍ ቃል ይቀይሩ: የመገለጫ ቅንብሮች > ደህንነት\n• ባለ ሁለት ደረጃ ማረጋገጫን ያንቁ (የሚመከር)\n• ንቁ ክፍለ ጊዜዎችን ይገምግሙ\n• የመግቢያ ታሪክ ይመልከቱ\n\n❌ መለያ ይሰርዙ:\n• የመገለጫ ቅንብሮች > ግላዊነት > መለያ ሰርዝ\n• መረጃዎ በቋሚነት ይወገዳል\n\nእገዛ ይፈልጋሉ? support@minalesh.com ያነጋግሩ'
    },
    {
      keywords: ['ዋጋ', 'ወጪ', 'ውድ', 'ርካሽ', 'ቅናሽ', 'ሽያጭ', 'ቅናሽ', 'ኩፖን'],
      response: 'የዋጋ አወጣጥ እና ማስተዋወቂያዎች:\n\n💰 ምርጥ ስምምነቶች:\n• ዕለታዊ ስምምነቶች - በተመረጡ እቃዎች እስከ 50% ቅናሽ\n• ፈጣን ሽያጮች - የተገደበ ጊዜ ቅናሾች\n• የወቅት ሽያጮች - የበዓል ቅናሾች\n• የሻጭ ማስተዋወቂያዎች - በቀጥታ ከሻጮች\n\n🎫 የኩፖን ኮዶች:\n• በቼክ አውት ላይ ለቅጽበታዊ ቁጠባ ያስገቡ\n• በተፈቀደበት ጊዜ ብዙ ኩፖኖችን ይደምሩ\n• ለተለየ ኮዶች ለጋዜጣችን ይመዝገቡ\n\n📦 በጅምላ ቅናሾች:\n• በብዛት ሲገዙ የበለጠ ይቆጥቡ\n• ለንግዶች እና ለድጋሚ ሻጮች ጥሩ\n\n🔔 የዋጋ ማንቂያዎች:\n• እቃዎችን ወደ ምኞት ዝርዝር ያክሉ\n• ዋጋዎች ሲወርዱ ማሳወቂያ ይቀበሉ\n• ስምምነትን በጭራሽ አያመልጥዎት!\n\nጠቃሚ ምክር: ለፈጣን ሽያጭ ማስታወቂያዎች በማህበራዊ ሚዲያ ይከተሉን!'
    },
    {
      keywords: ['ማነጋገር', 'ድጋፍ', 'እገዛ', 'የደንበኛ አገልግሎት', 'ስልክ', 'ኢሜይል'],
      response: 'የደንበኛ ድጋፍን ያነጋግሩ:\n\n💬 የቀጥታ ውይይት:\n• በ24/7 እዚህ በዚህ ውይይት ውስጥ ይገኛል!\n• ለአስቸኳይ ጥያቄዎች በጣም ፈጣን ምላሽ\n\n📧 የኢሜይል ድጋፍ:\n• support@minalesh.com\n• በ24 ሰዓታት ውስጥ ምላሽ\n• ለፈጣን መፍትሄ ቅጽበታዊ ገጽታዎችን ያያይዙ\n\n📞 የስልክ ድጋፍ:\n• +251-11-XXX-XXXX (አዲስ አበባ)\n• ሰኞ-አርብ: 8 ጠዋት - 8 ምሽት\n• ቅዳሜ: 9 ጠዋት - 5 ከሰዓት\n\n🏢 ቢሮ ጉብኝት:\n• ቦሌ፣ አዲስ አበባ\n• ሰኞ-አርብ: 9 ጠዋት - 6 ከሰዓት\n• እባክዎን ለመርሐግብር ቀድመው ይደውሉ\n\n📱 ማህበራዊ ሚዲያ:\n• ፌስቡክ: @MinaleshMarket\n• ትዊተር: @MinaleshET\n• ኢንስታግራም: @minalesh.ethiopia\n\nአስቸኳይ? ለቅጽበታዊ እገዛ ውይይቱን ይጠቀሙ!'
    },
    {
      keywords: ['ምኞት', 'ተወዳጅ', 'አስቀምጥ', 'ምልክት'],
      response: 'የምኞት ዝርዝር ባህሪያት:\n\n❤️ ወደ ምኞት ዝርዝር አክል:\n• በማንኛውም ምርት ላይ የልብ አዶውን ጠቅ ያድርጉ\n• እቃዎችን ለኋላ ያስቀምጡ\n• የምኞት ዝርዝርዎን ከጓደኞች ጋር ያጋሩ\n\n🔔 ጥቅሞች:\n• የዋጋ መቀነስ ማሳወቂያዎችን ያግኙ\n• ከክምችት ወደ ውጭ ማንቂያዎችን ይቀበሉ\n• ብዙ የምኞት ዝርዝሮችን ይፍጠሩ (ሰርግ፣ የልደት ቀን፣ ወዘተ)\n• ከማንኛውም መሳሪያ ይድረሱ\n\n📤 አጋራ:\n• የምኞት ዝርዝርዎን በአገናኝ ያጋሩ\n• ለስጦታ መመዝገቢያዎች ፍጹም\n• ጓደኞች የሚፈልጉትን ማየት ይችላሉ\n\nየምኞት ዝርዝርዎን በዳሽቦርድ > ምኞት ዝርዝር ያግኙት'
    },
    {
      keywords: ['ግምገማ', 'ደረጃ', 'አስተያየት', 'አስተያየት'],
      response: 'የምርት ግምገማዎች እና ደረጃዎች:\n\n⭐ ግምገማ ይተው:\n1. ምርቱን ይግዙ\n2. ወደ ዳሽቦርድ > ትዕዛዞች ይሂዱ\n3. በተላኩ እቃዎች ላይ "ግምገማ ጻፍ" ላይ ጠቅ ያድርጉ\n4. ተሞክሮዎን ይገምግሙ እና ያጋሩ\n\n✍️ ምን ማካተት አለበት:\n• የምርት ጥራት እና ትክክለኛነት\n• የማድረስ ልምድ\n• ፎቶዎች ወይም ቪዲዮዎች (ጠቃሚ!)\n• ታማኝ አስተያየት\n\n🎁 ሽልማቶች:\n• ለዝርዝር ግምገማዎች ነጥቦችን ያግኙ\n• ሌሎች ገዢዎች ውሳኔ እንዲያደርጉ ይርዱ\n• ከፍተኛ ገምጋሚዎች ባጅዎችን ያገኛሉ\n\n📊 እምነት:\n• የተረጋገጡ ግዢዎች ብቻ መገምገም ይችላሉ\n• ግምገማዎች ለትክክለኛነት ይቆጣጠራሉ\n• ሻጮች ለአስተያየት ምላሽ መስጠት ይችላሉ'
    },
    {
      keywords: ['ምድቦች', 'አስሱ', 'ምርቶች', 'እቃዎች', 'ካታሎግ'],
      response: 'ካታሎጋችንን ያስሱ:\n\n🏷️ ተወዳጅ ምድቦች:\n• ኤሌክትሮኒክስ እና ጋጄቶች\n• ፋሽን እና ልብስ\n• ቤት እና የአትክልት ቦታ\n• ውበት እና የግል እንክብካቤ\n• ስፖርት እና ከቤት ውጭ\n• መጽሃፍት እና የጽህፈት መሳሪያዎች\n• ባህላዊ የኢትዮጵያ እቃዎች\n\n🔍 የማሰስ ጠቃሚ ምክሮች:\n• ውጤቶችን ለማጠር ማጣሪያዎችን ይጠቀሙ\n• በዋጋ፣ በታዋቂነት ወይም በአዲስ ደርድር\n• የሻጭ ደረጃዎችን ይፈትሹ\n• የደንበኛ ግምገማዎችን ያንብቡ\n\n✨ ተለይተው የቀረቡ:\n• አዳዲስ መድረሻዎች - የቅርብ ጊዜ ምርቶች\n• አዝማሚያ - በጣም ተወዳጅ እቃዎች\n• ከፍተኛ ደረጃ - ከፍተኛ የደንበኛ እርካታ\n\nበ minalesh.com/categories ተጨማሪ ያግኙ'
    },
    {
      keywords: ['ዋስትና', 'ዋስትና', 'ጉድለት', 'ጉዳት'],
      response: 'ዋስትና እና ዋስትናዎች:\n\n✅ የምርት ዋስትና:\n• ኤሌክትሮኒክስ: የ1 ዓመት የአምራች ዋስትና\n• እቃዎች: የ6 ወር ዋስትና\n• ሌሎች እቃዎች: በምርት እና በሻጭ ይለያያል\n\n🛡️ የሚናሌሽ ዋስትና:\n• ትክክለኛ ምርቶች ብቻ\n• እቃው እንደተገለጸው ካልሆነ የገንዘብ ተመላሽ\n• ለጉድለት ባላቸው እቃዎች ነፃ የመመለሻ መላኪያ\n• ከውሸት ዕቃዎች ጥበቃ\n\n⚠️ ጉድለቶችን ሪፖርት ያድርጉ:\n1. ከማድረስ በ7 ቀናት ውስጥ ያነጋግሩን\n2. የጉድለት ፎቶዎችን/ቪዲዮዎችን ያቅርቡ\n3. ለመመለስ ወይም ለመተካት ፈቃድ ያግኙ\n4. የገንዘብ ተመላሽ ወይም ልውውጥ ይምረጡ\n\n📝ይያዙ:\n• ዋናው ማሸጊያ\n• የዋስትና ካርድ\n• የግዢ ደረሰኝ\n\nየዋስትና ጥያቄዎች? warranty@minalesh.com ያነጋግሩ'
    },
    {
      keywords: ['ቋንቋ', 'አማርኛ', 'ኦሮምኛ', 'መተርጎም', 'ቋንቋዎች'],
      response: 'የቋንቋ ድጋፍ:\n\n🌍 ያሉ ቋንቋዎች:\n• English (EN)\n• አማርኛ (Amharic - AM)\n• Afaan Oromoo (Oromo - OM)\n\n🔄 እንዴት መቀየር:\n• በከፍተኛው ምናሌ ውስጥ የቋንቋ አዶውን (🌐) ጠቅ ያድርጉ\n• የሚመርጡትን ቋንቋ ይምረጡ\n• ሁሉም ይዘት በራስ-ሰር ይዘምናል\n• ምርጫዎ ተቀምጧል\n\n💬 የውይይት ድጋፍ:\n• ይህ AI ረዳት ሁሉንም 3 ቋንቋዎችን ይደግፋል\n• በቋንቋዎ ብቻ ጥያቄዎችን ይጠይቁ\n• በተመሳሳይ ቋንቋ ምላሾችን ያግኙ\n\n📱 ማስታወሻ: አንዳንድ የምርት መግለጫዎች በእንግሊዝኛ ብቻ ሊገኙ ይችላሉ። ሁሉንም ይዘት ለመተርጎም እየሰራን ነው!'
    },
    {
      keywords: ['ደህንነት', 'ደህንነቱ የተጠበቀ', 'ማጭበርበር', 'ማጭበርበር', 'ግላዊነት', 'መረጃ'],
      response: 'ደህንነት እና ግላዊነት:\n\n🔒 መረጃዎን እንጠብቃለን:\n• የባንክ ደረጃ ማመስጠር (SSL/TLS)\n• PCI DSS ተገዢ የክፍያ ሂደት\n• የካርድ ዝርዝሮች አስቀማጭ የለም\n• መደበኛ የደህንነት ኦዲት\n\n🛡️ ደህንነቱ የተጠበቀ ግዢ:\n• የተረጋገጡ ሻጮች ብቻ\n• የገዢ ጥበቃ ፕሮግራም\n• ደህንነቱ የተጠበቀ የቼክ ሂደት\n• የማጭበርበር ፈልጎ ማግኛ ስርዓት\n\n👤 ግላዊነትዎ:\n• GDPR ተገዢ\n• የግል መረጃ ሽያጭ የለም\n• መረጃዎን በማንኛውም ጊዜ ወደ ውጭ ላክ\n• መለያ ሰርዝ አማራጭ ይገኛል\n\n⚠️ አጠራጣሪ እንቅስቃሴን ሪፖርት ያድርጉ:\n• ያልተለመደ የሻጭ ባህሪ\n• የተጠረጠረ ውሸት እቃዎች\n• የማስገር ሙከራዎች\n• ኢሜይል: security@minalesh.com\n\nደህንነቱን ይጠብቁ: የይለፍ ቃል በጭራሽ አያጋሩ ወይም ከመድረክ ውጭ አይክፈሉ!'
    },
    {
      keywords: ['መተግበሪያ', 'ሞባይል', 'አይኦኤስ', 'አንድሮይድ', 'አውርድ'],
      response: 'የሞባይል መተግበሪያዎች:\n\n📱 በቅርቡ ይመጣል!\nለሚከተሉት የሞባይል መተግበሪያዎችን እያዘጋጀን ነው:\n• iOS (iPhone/iPad)\n• Android መሳሪያዎች\n\n🌐 ባለበት ጊዜ:\n• ለሞባይል የተመቻቸውን ድረ-ገጻችንን ይጠቀሙ\n• በሁሉም መሳሪያዎች ላይ በጥሩ ሁኔታ ይሰራል\n• ለመተግበሪያ መሰል ልምድ ወደ መነሻ ገጽ ያክሉ\n\n🔔 ማሳወቂያ ይቀበሉ:\n• ለጋዜጣችን ይመዝገቡ\n• በማህበራዊ ሚዲያ ይከተሉን\n• መተግበሪያዎች ሲጀመሩ የመጀመሪያው ለማወቅ\n\nየሞባይል ድረ-ገጹ ሁሉንም ባህሪያት አለው: ግዢ፣ መከታተል፣ AR ሙከራ እና ሌሎችም!'
    }
  ],
  om: [
    {
      keywords: ['daldaltuu', 'gurgurtaa', 'ta\'uu', 'galmaa\'uu', 'negadee', 'galmee'],
      response: 'Minalesh irratti daldaltuu ta\'uuf:\n\n1. Herrega uumaa ykn seenaa\n2. Gara Dashboard kee deemaa\n3. Odeeffannoo daldalaa kee guutuu xumuree\n4. Waraqaa Daldalaa fi Lakkoofsa TIN kennaa\n5. Hayyama bulchaa eegaa (yeroo baay\'ee guyyoota hojii 1-2)\n6. Oomishaalee kee tarreessuu jalqabi!\n\n📦 Faayidaa Minalesh irratti gurguruu:\n• Maamiltuu Itoophiyaa miliyoona hedduutti dhaqqabuu\n• Adeemsa kaffaltii walitti qabame\n• Meeshaalee gabaa fi beeksisaa\n• Dashboard xiinxala yeroo dhugaa\n• Gatii komishinii gadi bu\'aa\n\nGargaarsa barbaaddaa? Deeggarsaa daldaltootaa support@minalesh.com quunnamaa'
    },
    {
      keywords: ['AR', 'yaalii', 'dhugaa', 'mul\'isa', 'amala', '3D'],
      response: 'Yaaliin AR oomishaawwan filatamoo kanneen akka borqii, kophee, fi meeshaalee biroo irratti argama!\n\n✨ Amaloota:\n• Oomishaaleen si irratti akkamitti akka fakkaatan yeroo qajeelaa ilaalaa\n• Kofa fi bakka adda addaa yaali\n• Murtii bittaa amanamaa godhadha\n• Kaameraa meeshaa keetiin hojjeta\n\n🔍 Akkamitti fayyadamuu:\n1. Fuula oomishaawwan irratti mallattoo "AR View" argadhu\n2. Kaameraa kakaasuf cuqaasaa\n3. Hayyama kaameraa eeyyami\n4. Oomisha dhugaa hin taane tiin yaali!\n\nYaadannoo: Amaloota AR meeshaalee mobaayilaa kaameraa qabaniin gaarii hojjetu.'
    },
    {
      keywords: ['kaffaltii', 'kaffaluu', 'kaardii', 'maallaqa', 'TeleBirr', 'CBE'],
      response: 'Mala kaffaltii hedduu fudhanna:\n\n💳 Kaardiiwwan Kireeditii/Debitii:\n• Visa, Mastercard, American Express\n• Encryption nageenya qabu fi walsimannaa PCI\n\n📱 Maallaqa Mobaayilaa:\n• TeleBirr\n• CBE Birr\n• M-Pesa\n• HelloCash\n\n💵 Maallaqa Yeroo Oomishaan Dhufu (COD):\n• Finfinnee, Dire Dawa, Mekelle, fi Bahir Dar keessatti argama\n• Yeroo ajaja kee fudhattetti kaffalaa\n\n🏦 Jijjiirraa Baankii:\n• Baankii Itoophiyaa ijoo hunduu deeggarama\n\nDaldalli hundi encryption sadarkaa baankii tiin eegame. Odeeffannoo kaffaltii kee tajaajiltoota keenya irratti gonkumaa hin kuufamu.'
    },
    {
      keywords: ['ergaa', 'erguu', 'geejjiba', 'kuriiyar'],
      response: 'Odeeffannoo Ergaa:\n\n📦 Ergaa Bilisaa:\n• Ajajni Birrii 500 ol ta\'u biyyattii guutuutti ergaa bilisaa argata\n\n⏱️ Yeroo Ergaa:\n• Idilee: guyyoota hojii 3-5\n• Saffisaa: guyyoota hojii 1-2 (kaffaltii dabalataa)\n• Guyyaa tokkotti: Finfinnee keessatti ajajni sa\'aatii 2 WD dura godhamuuf ni argama\n\n🗺️ Bal\'ina:\n• Gara magaalota Itoophiyaa hundaatti ergaa biyyattii guutuu\n• Bakkeewwan fagoo guyyoota dabalataa 1-2 gaafachuu danda\'u\n\n📍 Hordofuu:\n• Hordoffii yeroo dhugaa karaa SMS fi email\n• Dashboard kee > Ajajawwan keessatti hordofaa\n• Tarkaanfii hundatti beeksisa argadhu\n\nGaaffii waa\'ee ergaa keetii qabdaa? shipping@minalesh.com quunnamaa'
    },
    {
      keywords: ['deebisuu', 'maallaqa deebisuu', 'jijjiirraa', 'haquu', 'wabii'],
      response: 'Imaammata Deebisuu fi Maallaqa Deebisuu:\n\n✅ Foddaa Deebisuu:\n• Meeshaalee hedduu irraaf guyyoota 7\n• Elektirooniksii irraaf guyyoota 14\n• Oomishaalee hanqina qabaniif guyyoota 30\n\n📋 Haala:\n• Meeshaaleen hin fayyadamne fi qindaa\'ina jalqabaa keessa ta\'uu qabu\n• Meeshaalee dabalataa fi galmee hunda hammataa\n• Uffata dhihoo ykn oomishaalee mancaasan irratti deebisuu hin jiru\n\n💰 Adeemsa Maallaqa Deebisuu:\n1. Gara Dashboard > Ajajawwan deemaa\n2. "Deebisuu Gaafadhu" filadhu\n3. Sababa filadhuu fi suuraa olkeessi\n4. Sa\'aatii 24 keessatti hayyama argadhu\n5. Maallaqa deebisuu guyyoota hojii 5-7 keessatti raawwatama\n\n🔄 Jijjiirraa:\n• Meeshaalee dogoggora/hanqina qabaniif jijjiirraa bilisaa\n• Uffataaf jijjiirraa guddina ni argama\n\nGargaarsaaf returns@minalesh.com quunnamaa.'
    },
    {
      keywords: ['hordofuu', 'ajaja', 'haala', 'eessa', 'bakka'],
      response: 'Ajaja Kee Hordofuu:\n\n📱 Mala 1 - Dashboard:\n1. Gara herrega keetii seenaa\n2. Gara Dashboard > Ajajawwan deemaa\n3. Lakkoofsa ajaja kee irra cuqaasaa\n4. Kaartaa hordoffii yeroo dhugaa fi haala ilaalaa\n\n📧 Mala 2 - Email/SMS:\n• Geessituu hordoffii gara kee ergame fayyadamaa\n• Lakkoofsa ajaja keetii fi email kee galchaa\n\n📍 Haalota Ajajaa:\n• Ajajni Mirkaneeffame - Ajaja kee fudhanneerra\n• Adeemsa keessa - Ergaaf qophaa\'aa jira\n• Ergame - Karaa si gahuutti jira\n• Ergaaf Ba\'e - Har\'a si gahuutti jira\n• Ga\'e - Milkaa\'inaan fudhatame\n\n❓ Hordoffii irratti rakkoo? Lakkoofsa ajaja keetiin support@minalesh.com quunnamaa.'
    },
    {
      keywords: ['herrega', 'piroofaayilii', 'seenuu', 'jecha icciitii', 'dagate', 'irra deebi\'ii', 'maqaa fayyadamaa'],
      response: 'Bulchiinsa Herregaa:\n\n🔐 Jecha Icciitii Dagatteettaa:\n1. Fuula seensaa irratti "Jecha Icciitii Dagate" cuqaasaa\n2. Teessoo email kee galchaa\n3. Geessituu irra deebi\'iif email ilaali (sa\'aatii 1 hojjeta)\n4. Jecha icciitii haaraa uumaa\n\n👤 Piroofaayilii Haaromsaa:\n• Dashboard > Qindaa\'ina Piroofaayilii\n• Maqaa, bilbila, teessoo haaromsaa\n• Suuraa piroofaayilii dabalataa\n• Filannoo email bulchaa\n\n🔒 Nageenyaa:\n• Jecha icciitii jijjiiraa: Qindaa\'ina Piroofaayilii > Nageenyaa\n• Mirkaneessa sadarkaa lamaa kakaasaa (gorsa)\n• Yeroo qabatamaa ka\'umsa ilaalaa\n• Seenaa seensaa ilaalaa\n\n❌ Herrega Haqaa:\n• Qindaa\'ina Piroofaayilii > Dhuunfachuu > Herrega Haqaa\n• Deetaan kee bara baraaf haqama\n\nGargaarsa barbaaddaa? support@minalesh.com quunnamaa'
    },
    {
      keywords: ['gatii', 'baasii', 'qaqqaalii', 'salphaa', 'hir\'ina', 'gurgurtaa', 'dhiyeessii', 'kuupoonii'],
      response: 'Gatii fi Beeksisa:\n\n💰 Waliigaltee Gaarii:\n• Waliigaltee Guyyaa - Meeshaalee filatamoo irratti hanga 50% hir\'ina\n• Gurgurtaa Saffisaa - Dhiyeessii yeroo daangeffame\n• Gurgurtaa Waqtii - Hir\'ina ayyaanaa\n• Beeksisa Daldaltootaa - Kallattiin daldaltootaa irraa\n\n🎫 Koodii Kuupoonii:\n• Yeroo kaffaltii keessatti galchiidhaan qusannaa hatattamaa argadhu\n• Yeroo hayyamamu kuupoonii hedduu walitti qabu\n• Koodii addaatiif gaazexaa keenyaaf galmaa\'i\n\n📦 Hir\'ina Hedduu:\n• Yeroo hedduu bittuu baay\'inaan qusannaa\n• Daldalaa fi gurgurattoota lammataa irraaf gaarii\n\n🔔 Beeksisa Gatii:\n• Meeshaalee gara tarree hawwii dabalataa\n• Yeroo gatiin gadi bu\'u beeksisa argadhu\n• Waliigaltee gonkumaa hin dagatinaa!\n\nGorsa: Beeksisa gurgurtaa saffisaaf miidiyaa hawaasaa irratti nu hordofaa!'
    },
    {
      keywords: ['quunnamtii', 'deeggarsa', 'gargaarsa', 'tajaajila maamiltootaa', 'bilbila', 'email'],
      response: 'Deeggarsa Maamiltootaa Quunnamaa:\n\n💬 Haasawa Kallattii:\n• Sa\'aatii 24/7 asitti haasawa kana keessatti ni argama!\n• Gaaffii ariifachiisaaf deebii saffisaa\n\n📧 Deeggarsa Email:\n• support@minalesh.com\n• Sa\'aatii 24 keessatti deebii\n• Furmaata saffisaaf suuraa cuqoo maxxansi\n\n📞 Deeggarsa Bilbilaa:\n• +251-11-XXX-XXXX (Finfinnee)\n• Wiixata-Dilbata: 8 WB - 8 WD\n• Sanbata: 9 WB - 5 WD\n\n🏢 Daawwannaa Waajjiraa:\n• Bole, Finfinnee\n• Wiixata-Dilbata: 9 WB - 6 WD\n• Mee sagantaa qopheessuuf dursinee bilbilaa\n\n📱 Miidiyaa Hawaasaa:\n• Facebook: @MinaleshMarket\n• Twitter: @MinaleshET\n• Instagram: @minalesh.ethiopia\n\nAriifachiisaa? Gargaarsa hatattamaaf haasawa fayyadamaa!'
    },
    {
      keywords: ['tarree hawwii', 'jaallatamaa', 'olkaa\'i', 'mallattoo'],
      response: 'Amaloota Tarree Hawwii:\n\n❤️ Gara Tarree Hawwii Dabalataa:\n• Oomisha kamiyyuu irratti mallattoo onnee cuqaasaa\n• Meeshaalee booda ta\'uuf olkaa\'i\n• Tarree hawwii kee hiriyyoota waliin qoodaa\n\n🔔 Faayidaa:\n• Beeksisa gatii hir\'inaa argadhu\n• Beeksisa kuusaa deebi\'ee argamu argadhu\n• Tarree hawwii hedduu uumaa (Fuudhaa fi Heeruma, Guyyaa Dhalootaa, kkf)\n• Meeshaa kamiyyuu irraa dhaqqabuu\n\n📤 Qooduu:\n• Tarree hawwii kee geessituu tiin qoodaa\n• Galmee kennaa irraaf gaarii\n• Hiriyyoonni waan barbaaddu arguu danda\'u\n\nTarree hawwii kee Dashboard > Tarree Hawwii keessatti argadhu'
    },
    {
      keywords: ['gamaaggama', 'sadarkaa', 'yaada', 'ibsa'],
      response: 'Gamaaggama fi Sadarkaa Oomishaa:\n\n⭐ Gamaaggama Dhiheessi:\n1. Oomisha bitaa\n2. Gara Dashboard > Ajajawwan deemaa\n3. Meeshaalee ergaman irratti "Gamaaggama Barreessi" cuqaasaa\n4. Muuxannoo kee madaali fi qoodaa\n\n✍️ Maal Hammatuu Qabaata:\n• Qulqullina fi sirrii ta\'uu oomishaa\n• Muuxannoo ergaa\n• Suuraa ykn viidiyoo (gargaaraa!)\n• Yaada amanamaa\n\n🎁 Badhaasa:\n• Gamaaggama bal\'aa irraaf qabxii argadhu\n• Bitattootaa biroo murtii akka godhan gargaari\n• Gamaaggamtoota olaanoo baajiiwwan argatu\n\n📊 Amantaa:\n• Bittoonni mirkaneeffaman qofa gamaaggamuu danda\'u\n• Gamaaggamoonni dhugummaaf hordofamu\n• Daldaltoota yaadaaf deebii kennuu danda\'u'
    },
    {
      keywords: ['ramaddii', 'sakatta\'aa', 'oomishaalee', 'meeshaalee', 'kaataaloogii'],
      response: 'Kaataaloogii Keenya Sakatta\'aa:\n\n🏷️ Ramaddii Jaallatamaa:\n• Elektirooniksii fi Meesha Harkaa\n• Faashinii fi Uffata\n• Mana fi Iddoo Biqiltuu\n• Miidhagina fi Kunuunsa Dhuunfaa\n• Ispoortii fi Ala Manaa\n• Kitaabota fi Meeshaalee Barreessuu\n• Meeshaalee Aadaa Itoophiyaa\n\n🔍 Gorsaawwan Sakatta\'aa:\n• Bu\'aa xiqqeessuuf gingilchaa fayyadamaa\n• Gatii, jaalala, ykn haaraatiin tartiiba\n• Sadarkaa daldaltootaa ilaali\n• Gamaaggama maamiltootaa dubbiisaa\n\n✨ Adda Ba\'aa:\n• Haaraan Dhufe - Oomishaalee yeroo dhiyoo\n• Jiraataa - Meeshaalee jaallatamoo ta\'an\n• Sadarkaa Olaanaa - Quufa maamiltootaa olaanaa\n\nDabalataan minalesh.com/categories irratti argadhaa'
    },
    {
      keywords: ['wabii', 'mirkaneessa', 'hanqina', 'miidhaa'],
      response: 'Wabii fi Mirkaneessa:\n\n✅ Wabii Oomishaa:\n• Elektirooniksii: Wabii oomishtuu waggaa 1\n• Meeshaalee: Wabii ji\'a 6\n• Meeshaalee biroo: Oomishaa fi daldaltuu tiin garaagarummaa qabaata\n\n🛡️ Mirkaneessa Minalesh:\n• Oomishaalee dhugaa qofa\n• Oomishaan akka ibsame hin taane yoo ta\'e maallaqa deebisuu\n• Meeshaalee hanqina qabaniif ergaa deebisuu bilisaa\n• Eegumsa meeshaalee soba irraa\n\n⚠️ Hanqina Gabaasaa:\n1. Guyyoota 7 keessatti ergaa booda nu quunnamaa\n2. Suuraa/viidiyoo hanqina kennaa\n3. Deebisuu ykn bakka bu\'iif hayyama argadhu\n4. Maallaqa deebisuu ykn jijjiirraa filadhu\n\n📝 Qabaa:\n• Qindaa\'ina jalqabaa\n• Kaardii wabii\n• Ragaa bittaa\n\nGaaffii wabii? warranty@minalesh.com quunnamaa'
    },
    {
      keywords: ['afaan', 'amharic', 'oromoo', 'hiikuu', 'afaanota'],
      response: 'Deeggarsa Afaanii:\n\n🌍 Afaanota Jiran:\n• English (EN)\n• አማርኛ (Amharic - AM)\n• Afaan Oromoo (Oromo - OM)\n\n🔄 Akkamitti Jijjiiruu:\n• Baafata gubbaa keessatti mallattoo afaanii (🌐) cuqaasaa\n• Afaan filatte filadhu\n• Qabiyyeen hundi ofumaan haaromfama\n• Filannoo kee olkaa\'ama\n\n💬 Deeggarsa Haasawaa:\n• Gargaaraan AI kun afaanota 3 hunda deeggaraa\n• Salphaatti gaaffii afaan keetiin gaafadhu\n• Deebii afaan tokkotti argadhu\n\n📱 Yaadannoo: Ibsi oomishaa tokko tokko Ingiliffaa qofaan argamuu danda\'a. Qabiyyee hunda hiikuuf hojjechaa jirra!'
    },
    {
      keywords: ['nageenyaa', 'nageenya qabu', 'gowwoomsaa', 'sobaa', 'dhuunfachuu', 'deetaa'],
      response: 'Nageenyaa fi Dhuunfachuu:\n\n🔒 Deetaa Kee Eegna:\n• Encryption sadarkaa baankii (SSL/TLS)\n• Adeemsa kaffaltii walsimannaa PCI DSS\n• Kuusaa bal\'inaa kaardii hin jiru\n• Sakatta\'aa nageenyaa idilee\n\n🛡️ Bittaa Nageenya Qabu:\n• Daldaltoota mirkaneeffaman qofa\n• Sagantaa eegumsa bitattootaa\n• Adeemsa kaffaltii nageenya qabu\n• Sirna argannoo gowwoomsaa\n\n👤 Dhuunfachuu Kee:\n• Walsimannaa GDPR\n• Gabaa deetaa dhuunfaa hin jiru\n• Deetaa kee yeroo barbaadde alaatti ergi\n• Filannoo herrega haquu ni argama\n\n⚠️ Sochiiwwan Shakkii Qabu Gabaasaa:\n• Amala daldaltuu hin barame\n• Meeshaalee soba ta\'uu shakkame\n• Yaaliiwwan fiiziingii\n• Email: security@minalesh.com\n\nNageenya tursiisaa: Jecha icciitii gonkumaa hin qoodinaa ykn waltajjii ala hin kaffalinaa!'
    },
    {
      keywords: ['appii', 'mobaayilaa', 'ios', 'android', 'buufachuu'],
      response: 'Appiiwwan Mobaayilaa:\n\n📱 Dhiyootti Ni Dhufa!\nAppiiwwan mobaayilaa kanneen armaan gadii qopheessaa jirra:\n• iOS (iPhone/iPad)\n• Meeshaalee Android\n\n🌐 Yeroo Ammaa:\n• Marsariitii mobaayilaaf mijate keenya fayyadamaa\n• Meeshaalee hunda irratti gaarii hojjeta\n• Muuxannoo appii fakkaatuu argachuuf gara fuula manaa dabalataa\n\n🔔 Beeksisa Argadhu:\n• Gaazexaa keenyaaf galmaa\'i\n• Miidiyaa hawaasaa irratti nu hordofaa\n• Appiiwwan yeroo eegalaman jalqabatti beekuf\n\nMarsariitiin mobaayilaa amaloota hunda qaba: bittaa, hordoffii, yaalii AR fi kkf!'
    }
  ]
};

function findBestMatch(message: string, language: 'en' | 'am' | 'om'): string | null {
  const kb = knowledgeBase[language];
  const lowerMessage = message.toLowerCase();
  
  let bestMatch = null;
  let highestScore = 0;
  
  for (const entry of kb) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        score++;
      }
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry.response;
    }
  }
  
  return highestScore > 0 ? bestMatch : null;
}

function getGreeting(language: 'en' | 'am' | 'om'): string {
  if (language === 'en') {
    return 'Hello! Welcome to Minalesh. How can I help you today?';
  } else if (language === 'am') {
    return 'ሰላም! ወደ ሚናሌሽ እንኳን ደህና መጡ። ዛሬ እንዴት ልርዳዎት እችላለሁ?';
  } else {
    return 'Akkam! Gara Minalesh baga nagaan dhuftan. Har\'a akkamitti sin gargaaruu danda\'a?';
  }
}

function getFallbackResponse(language: 'en' | 'am' | 'om'): string {
  if (language === 'en') {
    return 'I\'m here to help! I can assist you with:\n• Becoming a vendor\n• AR try-on features\n• Payment methods\n• Shipping and delivery\n• Returns and refunds\n• Order tracking\n• Account management\n\nWhat would you like to know more about?';
  } else if (language === 'am') {
    return 'ለመርዳት እዚህ ነኝ! ስለሚከተለው ልርዳዎ እችላለሁ:\n• ሻጭ መሆን\n• AR ሙከራ ባህሪያት\n• የክፍያ መንገዶች\n• ማድረስ እና ማስተላለፍ\n• ተመላሾች እና ተመላሾች\n• ትዕዛዝ መከታተል\n• የመለያ አስተዳደር\n\nስለምን የበለጠ ማወቅ ይፈልጋሉ?';
  } else {
    return 'Gargaaruuf asuman jira! Waa\'ee kanneenii sin gargaaruu danda\'a:\n• Daldaltuu ta\'uu\n• Amaloota AR yaalii\n• Mala kaffaltii\n• Ergaa fi geejjiba\n• Deebisuu fi maallaqa deebisuu\n• Ajaja hordofuu\n• Bulchiinsa herregaa\n\nWaa\'ee maalii baay\'ee beekuu barbaadda?';
  }
}

export async function POST(request: Request) {
  try {
    const { message, language, history }: ChatRequest = await request.json();
    
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Check for greetings
    const greetings = ['hi', 'hello', 'hey', 'greetings', 'ሰላም', 'ሄይ', 'akkam', 'nagaa'];
    if (greetings.some(g => message.toLowerCase().trim() === g)) {
      return NextResponse.json({
        response: getGreeting(language || 'en'),
        type: 'greeting'
      });
    }
    
    // Try to find a matching response
    const response = findBestMatch(message, language || 'en');
    
    if (response) {
      return NextResponse.json({
        response,
        type: 'answer'
      });
    }
    
    // Fallback response
    return NextResponse.json({
      response: getFallbackResponse(language || 'en'),
      type: 'fallback'
    });
    
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your message' },
      { status: 500 }
    );
  }
}
