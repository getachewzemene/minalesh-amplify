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
      keywords: ['vendor', 'seller', 'become', 'register', 'sell'],
      response: 'To become a vendor on Minalesh:\n1. Create an account or log in\n2. Go to your Dashboard\n3. Complete your profile with business details\n4. Provide Trade License and TIN Number\n5. Wait for admin approval\n6. Start listing your products!\n\nThe process typically takes 1-2 business days.'
    },
    {
      keywords: ['ar', 'augmented', 'reality', 'try', 'tryon', 'virtual'],
      response: 'AR Try-On is available for select products like sunglasses, caps, and some accessories! Look for the "AR View" badge on product pages. You can:\n• See how products look on you in real-time\n• Try different angles\n• Make confident purchase decisions\n\nNote: AR features work best on mobile devices with camera access.'
    },
    {
      keywords: ['payment', 'pay', 'checkout', 'card', 'mobile', 'money'],
      response: 'We accept multiple payment methods:\n• Credit/Debit Cards (Visa, Mastercard)\n• Mobile Money (M-Pesa, HelloCash, etc.)\n• Cash on Delivery (COD) in select cities\n• Bank Transfer\n\nAll transactions are secured with encryption. COD is available in Addis Ababa, Dire Dawa, Mekelle, and Bahir Dar.'
    },
    {
      keywords: ['shipping', 'delivery', 'ship', 'send'],
      response: 'Shipping Information:\n• Free shipping on orders over 500 ETB\n• Standard delivery: 3-5 business days\n• Express delivery: 1-2 business days (extra charge)\n• Nationwide coverage\n\nYou\'ll receive tracking information via SMS and email once your order ships.'
    },
    {
      keywords: ['return', 'refund', 'exchange'],
      response: 'Our return policy:\n• 7-day return window for most items\n• Items must be unused and in original packaging\n• Free returns for defective products\n• Refunds processed within 5-7 business days\n\nContact customer support to initiate a return.'
    },
    {
      keywords: ['track', 'order', 'status', 'where'],
      response: 'To track your order:\n1. Log in to your account\n2. Go to Dashboard > Orders\n3. Click on your order to see real-time tracking\n\nYou can also track using the link sent to your email/SMS.'
    },
    {
      keywords: ['account', 'profile', 'login', 'password', 'forgot'],
      response: 'Account help:\n• Forgot password? Use the "Forgot Password" link on login page\n• Update profile: Dashboard > Profile Settings\n• Change password: Profile Settings > Security\n\nContact support if you need additional assistance.'
    },
    {
      keywords: ['price', 'cost', 'expensive', 'cheap', 'discount'],
      response: 'We offer competitive prices on all products! Look for:\n• Daily Deals - Up to 50% off\n• Seasonal Sales\n• Vendor Promotions\n• Bulk Discounts\n\nSubscribe to our newsletter for exclusive offers!'
    }
  ],
  am: [
    {
      keywords: ['ሻጭ', 'መሆን', 'መሸጥ', 'ስራ'],
      response: 'በሚናሌሽ ሻጭ ለመሆን:\n1. መለያ ይፍጠሩ ወይም ይግቡ\n2. ወደ ዳሽቦርድ ይሂዱ\n3. የንግድ መረጃዎን ያጠናቅቁ\n4. የንግድ ፈቃድ እና ቲን ቁጥር ያቅርቡ\n5. የአስተዳዳሪ ፈቃድ ይጠብቁ\n6. ምርቶችዎን ማዘ���ዘት ይጀምሩ!\n\nሂደቱ 1-2 የስራ ቀናት ይወስዳል።'
    },
    {
      keywords: ['AR', 'ሙከራ', 'ምናባዊ', 'መስታወት'],
      response: 'AR ሙከራ እንደ መነጽሮች፣ ኮፍያዎች እና አንዳንድ መለዋወጫዎች ላይ ይገኛል! "AR View" ምልክቱን በምርት ገጾች ያዩ። እርስዎ:\n• ምርቶች በእርስዎ ላይ እንዴት እንደሚመስሉ በቀጥታ ይመልከቱ\n• የተለያዩ አቅጣጫዎችን ይሞክሩ\n• በራስ የሚጣር የግዢ ውሳኔ ያድርጉ\n\nማስታወሻ: AR ባህሪያት በካሜራ መዳረሻ ባላቸው ሞባይል መሳሪያዎች በተሻለ ይሰራሉ።'
    },
    {
      keywords: ['ክፍያ', 'ለመክፈል', 'ካርድ', 'ገንዘብ'],
      response: 'በርካታ የክፍያ መንገዶችን እንቀበላለን:\n• ክሬዲት/ዴቢት ካርዶች (ቪዛ፣ ማስተርካርድ)\n• የሞባይል ገንዘብ (ኤም-ፔሳ፣ ሄሎካሽ፣ ወዘተ)\n• በምርቶቹ ደርሶ መክፈል (COD) በተመረጡ ከተሞች\n• የባንክ ዝውውር\n\nሁሉም ግብይቶች በማመስጠር የተጠበቁ ናቸው። COD በአዲስ አበባ፣ ድሬዳዋ፣ መቐለ እና ባሕር ዳር ይገኛል።'
    },
    {
      keywords: ['ማድረስ', 'መላክ', 'ማጓጓዝ'],
      response: 'የማድረስ መረጃ:\n• ከ500 ብር በላይ በሆኑ ትዕዛዞች ላይ ነፃ ማድረስ\n• መደበኛ ማድረስ: 3-5 የስራ ቀናት\n• ፈጣን ማድረስ: 1-2 የስራ ቀናት (ተጨማሪ ክፍያ)\n• በመላ አገር ሽፋን\n\nትዕዛዝዎ ከተላከ በኋላ በኤስኤምኤስ እና በኢሜል የክትትል መረጃ ይደርስዎታል።'
    }
  ],
  om: [
    {
      keywords: ['daldaltuu', 'gurgurtaa', 'ta\'uu', 'galmaa\'uu'],
      response: 'Minalesh irratti daldaltuu ta\'uuf:\n1. Herrega uumaa ykn seenaa\n2. Gara Dashboard deemaa\n3. Odeeffannoo daldalaa keessanii xumuree\n4. Waraqaa Daldalaa fi Lakkoofsa TIN kennaa\n5. Hayyama bulchaa eegaa\n6. Oomishaalee kee tarreessuu jalqabi!\n\nAdeemsi guyyoota hojii 1-2 fudhata.'
    },
    {
      keywords: ['AR', 'yaalii', 'dhugaa', 'mul\'isa'],
      response: 'Yaaliin AR oomishaawwan filatamoo kanneen akka borqii, kophee, fi meeshaalee biroo irratti argama! "AR View" mallattoo fuula oomishaawwan irratti argaa. Isin:\n• Oomishaaleen si irratti akkamitti akka fakkaatan yeroo qajeelaa ilaalaa\n• Kofa adda addaa yaali\n• Murtii bittaa amanamaa godhadha\n\nYaadannoo: Amaloota AR meeshaalee mobaayilaa kaameraa qabaniin gaarii hojjetu.'
    },
    {
      keywords: ['kaffaltii', 'kaffaluu', 'kaardii', 'maallaqa'],
      response: 'Mala kaffaltii hedduu fudhanna:\n• Kaardiiwwan Kireeditii/Debitii (Visa, Mastercard)\n• Maallaqa Mobaayilaa (M-Pesa, HelloCash, fi kkf)\n• Maallaqa Yeroo Oomishaan Dhufu (COD) magaalota filatamoo keessatti\n• Jijjiirraa Baankii\n\nDaldalli hundi encryption tiin eegame. COD Finfinnee, Dire Dawa, Mekelle, fi Bahir Dar keessatti argama.'
    },
    {
      keywords: ['ergaa', 'erguu', 'geejjiba'],
      response: 'Odeeffannoo Ergaa:\n• Ajaja Birrii 500 ol ta\'etti ergaa bilisaa\n• Ergaa idilee: guyyoota hojii 3-5\n• Ergaa saffisaa: guyyoota hojii 1-2 (kaffaltii dabalataa)\n• Biyyattii guutuu keessatti argama\n\nAjajni keessan erga ergamee booda odeeffannoo hordoffii SMS fi email tiin ni argatu.'
    },
    {
      keywords: ['deebisuu', 'maallaqa deebisuu', 'jijjiirraa'],
      response: 'Seera deebisuu keenya:\n• Meeshaalee hedduu irraaf foddaa deebisuu guyyaa 7\n• Meeshaaleen hin fayyadamne fi qabxii jalqabaa keessa ta\'uu qabu\n• Oomishaalee hanqina qaban irratti deebisuu bilisaa\n• Maallaqa deebisuu guyyoota daldalaa 5-7 keessatti raawwatama\n\nDeebisuu jalqabuuf tajaajila maamiltootaa quunnamaa.'
    },
    {
      keywords: ['hordofuu', 'ajaja', 'haala', 'eessa'],
      response: 'Ajaja kee hordofuuf:\n1. Herrega keetti seenaa\n2. Gara Dashboard > Ajajawwan deemaa\n3. Ajaja kee irra cuqaasii hordoffii yeroo qajeelaa ilaalaa\n\nGeessituu email/SMS keetti ergame fayyadamuunis hordofuu dandeessa.'
    },
    {
      keywords: ['herrega', 'piroofaayilii', 'seenuu', 'jecha icciitii'],
      response: 'Gargaarsa herregaa:\n• Jecha icciitii dagatteettaa? Geessituu "Jecha Icciitii Dagate" fuula seensaa irratti fayyadamaa\n• Piroofaayilii haaromsuu: Dashboard > Qindaa\'ina Piroofaayilii\n• Jecha icciitii jijjiiruu: Qindaa\'ina Piroofaayilii > Nageenyaa\n\nYoo gargaarsa dabalataa barbaadde tajaajila quunnamaa.'
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
