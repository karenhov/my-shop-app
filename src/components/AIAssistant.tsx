import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessagesSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ========== LOCAL FAQ DATABASE (AI օգնականի միակ պատասխանների աղբյուրը) ==========
const FAQ_DATA = [
  {
    keywords: ['բարև', 'ողջույն', 'hi', 'hello', 'barev','barev cez'],
    answer: "👋 Ողջույն! Ես **EdgSport** խանութի AI օգնականն եմ։ Ինչո՞վ կարող եմ օգնել ձեզ այսօր։"
  },
  {
    keywords: ['ինչպես օգտվել կայքից', 'inchpes ogtvel kayqic', 'inchpes ogtvel kajqic', 'inchpes ogtvel', 'ինչպես օգտվել','ինչպես օգտագործել'],
    answer: "Շատ բարի \n\n😊:Կայքը նախատեսված է Մեծածախ գներով ապրանքների ցուցադրման պատվիրման և վաճառքի համար։Կայք մտնելիս դուք կտեսնեք կայքի էջի կենտրոնական հատվածում Դիտել Տեսականին գունավոր կոճակը՝ այն սեղմելով դուք կհայտնվեք Սպորտային կոշիկներ և Հողաթափեր բաժիներում նկարներով ցուցադրված։ Ըստ Ձեր ցանկությամբ կարող եք սեղմել այդ երկու նկարով պատուհաներից մեկի վրա և կհայտնվեք համապատասխան անվան տեսականիներով ապրանքերի։ Ձեզ մնում է ընտրել տեսականիները որոնք որ ցանկանում եք համապասխան քանակով սեղմել ուղղարկել զամբյուղ կոճակը <<նկարի տակի հատվածում է>> և անցենել զամբյուղ բաժին <<կայքի էջի վերևի աջ հատվածում է պետք է սեղմեք զամբյուղ նշանի վրա։Վերջում ընտրված տեսականին իրենց քանակներով կարող եք կիսվել viber whatsapp կամ telegram կոճակներից որևե մեկը սեղմելով ըստ ձեր ցանկության։"
  },
  {
    keywords: ['օգնություն', 'help', 'ognutyun', 'ինչպես'],
    answer: "ℹ️ Ես կարող եմ օգնել ձեզ.\n\n🛒 **Զամբյուղի** և պատվերի հետ\n📦 **Ապրանքների** մասին տեղեկություններ\n🔍 **Կայքում նավիգացիա**\n💬 **Կապի** միջոցներ\n\nԳլխավոր էջում սեղմեք **«ԴԻՏԵԼ ՏԵՍԱԿԱՆԻՆ»** կոճակը՝ տեսականին դիտելու համար։"
  },

  // ============ ԶԱՄԲՅՈՒՂ ============
  {
    keywords: ['զամբյուղ', 'ինչպես ուղղարկել ապրանք', 'inchpes @ntrel apranq', 'ավելացնել', 'որտեղ է զամբյուղը', 'vortex e zambyux@', 'zambyux', 'զամբուղ'],
    answer: "🛒 **Զամբյուղի** օգտագործում.\n\n1️⃣ Ապրանք ընտրելու համար սեղմեք **«ՈՒՂՂԱՐԿԵԼ ԶԱՄԲՅՈՒՂ»** կոճակը\n2️⃣ Զամբյուղը գտնում եք՝\n   💻 Համակարգչում՝ վերևի աջ անկյունում 🛒\n   📱 Հեռախոսում՝ ներքևի նավիգացիայի **«Զամբյուղ»** կոճակով\n3️⃣ Այնտեղ կարող եք՝\n   • Փոխել քանակները **+ / -** կոճակներով\n   • Ջնջել ապրանքները 🗑️\n   • Դիտել ընդհանուր գումարը"
  },
  {
    keywords: ['քանակ', 'qanaq', 'ավելացնել քանակ', 'պակասեցնել', 'plus minus', 'քանի հատ', 'qani hat'],
    answer: "🔢 **Քանակի փոփոխություն զամբյուղում**.\n\n➕ Սեղմեք **«+»** կոճակը՝ քանակն ավելացնելու համար\n➖ Սեղմեք **«-»** կոճակը՝ քանակը պակասեցնելու համար\n\n💡 Ընդհանուր գումարը ավտոմատ կհաշվարկվի։"
  },
  {
    keywords: ['ջնջել', 'հեռացնել', 'dnjel', 'heracnel', 'trash', 'աղբ', 'delete', 'remove'],
    answer: "🗑️ **Ապրանքը զամբյուղից հեռացնել**.\n\nՍեղմեք 🗑️ **աղբամանի** պատկերին՝ ապրանքի կողքին գտնվող կոճակը՝ զամբյուղից հեռացնելու համար։"
  },
  {
    keywords: ['մաքրել զամբյուղը', 'maqrel zambyux@', 'բոլորը ջնջել', 'մաքրել', 'ՄԱՋՐԵԼ', 'maqrel'],
    answer: "🧹 **Զամբյուղի մաքրում**.\n\nՍեղմեք վերևի **«ՄԱՋՐԵԼ»** (🗑️) կարմիր կոճակը՝ զամբյուղի բոլոր ապրանքները հեռացնելու համար։\n\n⚠️ Ուշադրություն՝ գործողությունն անշրջելի է։"
  },
  {
    keywords: ['ընդհանուր գումար', 'endhanuragum', 'cnджамble', 'ընդամենը', 'endamenq', 'ամբողջ գին', 'ambogh gin'],
    answer: "💰 **Ընդհանուր գումարը** ցուցադրվում է Զամբյուղի էջի **«Ընդհանուր»** բաժնում՝ նարնջագույն գույնով (֏)։\n\nԱյն ավտոմատ հաշվարկվում է ըստ ընտրված ապրանքների և քանակների։"
  },

  // ============ ՊԱՏՎԵՐ ============
  {
    keywords: ['պատվեր', 'patver katarel', 'հաստատել', 'գնել', 'ձևակերպել', 'order', 'patver'],
    answer: "📦 **Պատվերի** ձևակերպում.\n\n1️⃣ Մտեք **ԶԱՄԲՅՈՒՂ** բաժին\n2️⃣ Լրացրեք ձեր տվյալները՝\n   • Անուն Ազգանուն\n   • Հեռախոսահամար\n   • Հասցե\n3️⃣ Սեղմեք **«ՀԱՍՏԱՏԵԼ ՊԱՏՎԵՐԸ»**\n4️⃣ Կապնվեք մեզ հետ **Viber/Telegram** միջոցով"
  },
  {
    keywords: ['անուն', 'anun', 'azganun', 'ազգանուն', 'herakhos', 'հեռախոս', 'hasce', 'հասցե', 'տվյալներ', 'tvyalner'],
    answer: "📝 **Պատվերի համար անհրաժեշտ տվյալներ**.\n\nԶամբյուղի **«ՊԱՏՎԻՐԵԼ»** բաժնում լրացրեք՝\n\n👤 **Անուն Ազգանուն**\n📞 **Հեռախոսահամար**\n📍 **Հասցե**\n\nՀետո սեղմեք **«ՀԱՍՏԱՏԵԼ ՊԱՏՎԵՐԸ»** կոճակը։"
  },
  {
    keywords: ['հաստատել պատվեր', 'hastatem patver', 'հաստատել', 'hastatem', 'confirm order', 'submit'],
    answer: "✅ **Պատվերի հաստատում**.\n\n1️⃣ Լրացրեք Անուն, Հեռախոս, Հասցե դաշտերը\n2️⃣ Սեղմեք **«ՀԱՍՏԱՏԵԼ ՊԱՏՎԵՐԸ»** կոճակը\n3️⃣ Կապնվեք ադմինիստրատորի հետ Viber/WhatsApp/Telegram-ով\n\n📞 Ձեր պատվերը կմշակվի հնարավորինս շուտ։"
  },

  // ============ ԿԻՍՎԵԼ ԶԱՄԲՅՈՒՂՈՎ ============
  {
    keywords: ['կիսվել զամբյուղով', 'ուղղարկել ընտրած տեսականին', 'inchpes uxrakel tesakanin', 'viber', 'whatsapp', 'telegram', 'kisvel zambyuxov'],
    answer: "📤 **Զամբյուղով կիսվել**.\n\n• **Viber**\n• **WhatsApp**\n• **Telegram**\n\nԿոճակները հայտնվում են զամբյուղում՝ երբ այնտեղ կա առնվազն **1 ապրանք**։ Կամ օգտվեք **«ԱԴՄԻՆ»** բաժնից։"
  },
  {
    keywords: ['կիսվել', 'share', 'ուղարկել', 'uzrakel', 'kisvel', 'նկար ուղարկել'],
    answer: "📤 **Զամբյուղով կիսվելը**.\n\n🎯 **Viber**, **WhatsApp** կամ **Telegram** կոճակները հայտնվում են զամբյուղում՝ երբ այնտեղ կա **առնվազն 1 ապրանք**։\n\n✅ Սեղմեք մեկին՝ ձեր ընտրած ապրանքների նկարը և տեղեկությունները ուղարկելու համար։"
  },

  // ============ ՆԿԱՐ ============
  {
    keywords: ['նկար', 'մեծացնել', 'դիտել', 'տեսնել', 'photo', 'nkar', 'metxacnel', 'ditel'],
    answer: "🖼️ **Նկարների** դիտում.\n\n📱 Նկարը մեծ դիտելու համար՝\n• **Սեղմած պահեք** նկարի վրա\n• Հետո ընտրեք մեծացնելու տարբերակը\n\n⚠️ Եթե նկարները չեն բացվում՝ թարմացրեք էջը (F5)"
  },

  // ============ ԶԵՂՉ / ՊՐՈՄՈԿՈԴ ============
  {
    keywords: ['զեղչ', 'պրոմոկոդ', 'promo', 'discount', 'արժեղչում', 'promokod', 'zelch', 'zeghch', 'կիրառել'],
    answer: "🎫 **Պրոմոկոդի** օգտագործում.\n\n1️⃣ Պրոմոկոդը ստանալ ադմինիստրատորից\n2️⃣ Մտեք **ԶԱՄԲՅՈՒՂ** բաժին\n3️⃣ Գրեք պրոմոկոդը **«Պրոմոկոդ»** դաշտում\n4️⃣ Սեղմեք **«ԿԻՐԱՌԵԼ»**\n\n✨ Զեղչը ավտոմատ հաշվարկվելու է ընդհանուր գումարից։"
  },
  {
    keywords: ['որտեղից ստանալ պրոմոկոդ', 'vortex ic stanal promokod', 'ինչպես ստանալ պրոմոկոդ', 'ունե՞ք զեղչ', 'unek zelch', 'kadr unenq zelchi', 'ունեք արդյոք զեղչեր'],
    answer: "🎁 **Պրոմոկոդ ստանալը**.\n\nՊրոմոկոդները տրամադրվում են անմիջապես **ադմինիստրատորի** կողմից (օր.՝ մշտական հաճախորդների կամ խոշոր պատվերների համար)։\n\n📞 Հարցրեք ուղիղ ադմինիստրատորին **Viber/WhatsApp/Telegram**-ով՝ զամբյուղը կիսելիս։"
  },
  {
    keywords: ['նվազագույն քանակ', 'min quantity', 'նվազագույն պատվեր', 'minimum order', 'qani hat glxavor', 'նվազագույնը քանի հատ', 'nvazagujn qanak'],
    answer: "📊 **Նվազագույն պատվերի քանակ**.\n\nՈրոշ ապրանքների համար կարող է սահմանված լինել **նվազագույն քանակ** (նշված է ապրանքի քարտի վրա, եթե առկա է)։\n\n💡 Եթե որևէ ապրանքի համար նման նշում չկա՝ կարող եք պատվիրել ցանկացած քանակով։\n\n📞 Ստույգ տեղեկության համար կապնվեք ադմինիստրատորի հետ։"
  },
  {
    keywords: ['ապրանքը չկա', 'ինչու չկա', 'ապրանքը դուրս է եկել', 'apranqy chka', 'out of stock', 'sold out', 'ապրանքը հեռացվել է', 'chka vacharqum'],
    answer: "📭 **Ապրանքը ցանկում չէ**.\n\nԱպրանքների ցանկը թարմացվում է ադմինիստրատորի կողմից՝ որոշ մոդելներ կարող են ժամանակավորապես **հանված** լինել կայքից։\n\n🔄 Փորձեք թարմացնել էջը (F5) կամ մի փոքր ուշ նորից ստուգել։\n\n📞 Կոնկրետ մոդելի հասանելիության համար կապնվեք ադմինիստրատորի հետ։"
  },
  {
    keywords: ['գրանցում', 'պետք ա գրանցվել', 'registration', 'account', 'հաշիվ', 'grancum petq a', 'պրոֆիլ', 'profil'],
    answer: "🔓 **Գրանցում պետք չէ**.\n\nԱպրանքներ դիտելու և պատվեր ձևակերպելու համար **գրանցում կամ հաշիվ պետք չէ**՝ պարզապես ընտրեք, ավելացրեք զամբյուղ և հաստատեք պատվերը։\n\n🔐 Մուտք/գաղտնաբառ պահանջվում է միայն **«ԱԴՄԻՆ»** բաժնի համար, որը նախատեսված է կայքի կառավարման համար։"
  },

  // ============ ԱՊՐԱՆՔՆԵՐ / ՏԵՍԱԿԱՆԻ ============
  {
    keywords: ['ապրանք', 'տեսականի', 'product', 'ինչ կա', 'կոշիկ', 'հողաթափ', 'apranq', 'tesakani', 'kosik', 'hoghatap'],
    answer: "👟 **Մեր տեսականին**.\n\n📂 Ունենք երկու հիմնական բաժին՝\n\n1️⃣ **ՍՊՈՐՏԱՅԻՆ ԿՈՇԻԿՆԵՐ**\n   • Բարձրորակ սպորտային մոդելներ\n   • Մեծածախ գներ\n\n2️⃣ **ՀՈՂԱԹԱՓԵՐ**\n   • Ամենօրյա և աշխատանքային\n   • Լայն տեսականի\n\n🔍 Դիտելու համար՝ սեղմեք **«ԴԻՏԵԼ ՏԵՍԱԿԱՆԻՆ»** կոճակը գլխավոր էջում։"
  },
  {
    keywords: ['սպորտային կոշիկներ', 'sport shoes', 'sportayin kosikner', 'nike', 'seo black', 'se gray', 'կոշիկներ'],
    answer: "👟 **Սպորտային Կոշիկներ** բաժնում կարող եք գտնել՝\n\n• **Nike SE Gray** — 3,500 ֏ (Չափսեր 27-31)\n• **Shoes SEO Black** — 2,000 ֏ (Չափսեր 25-30)\n• Եվ բազմաթիվ այլ մոդելներ\n\n📦 Յուրաքանչյուր ապրանքի վրա նշված է **կոդը** և **հասանելի չափսերը**։\n\n🔍 Փնտրեք անունով կամ կոդով վերևի **որոնման** դաշտով։"
  },
  {
    keywords: ['հողաթափ', 'hoghatap', 'հողաթափեր', 'hoghataper', 'slippers', 'copybara', 'yes e11', 'բիրկենշտոկ', 'birkenstock'],
    answer: "🩴 **Հողաթափեր** բաժնում կարող եք գտնել՝\n\n• **COPYBARA E19** — 1,600 ֏ (Չափսեր 24-29)\n• **YES! E11** — 1,600 ֏ (Չափսեր 24-29)\n• Եվ բազմաթիվ այլ մոդելներ\n\n📦 Բոլոր ապրանքներն ունեն **կոդ** և **չափս** նշումներ։\n\n🔍 Դիտելու համար սեղմեք **«ՀՈՂԱԹԱՓԵՐ»** բաժինը գլխավոր էջից։"
  },
  {
    keywords: ['կոդ', 'kod', 'апрanqi kod', 'ապրանքի կոդ', 'article', 'artikul', 'номер', 'nomer'],
    answer: "🔢 **Ապրանքի կոդը** նշված է՝\n\n• **Ապրանքի քարտի** վերևի ձախ անկյունում (օր.՝ 0019, 0033)\n• **Զամբյուղում** ապրանքի անվան տակ\n\n🔍 Կոդով որոնելու համար օգտվեք **«Փնտրել ապրանքը...»** դաշտից։"
  },
  {
    keywords: ['չափս', 'chapqs', 'size', 'չափսեր', 'chapqser', 'sizer', 'ոտքի չափ', 'votqi chaps'],
    answer: "📏 **Չափսերի** մասին.\n\n• Յուրաքանչյուր ապրանքի **հասանելի չափսերը** նշված են ապրանքի կողքին\n• Օրինակ՝ **Չափսեր 25-ից 30** կամ **24-ից 29**\n\n💡 Կոնկրետ չափսի առկայության համար կապնվեք ադմինիստրատորի հետ **Viber/Telegram**-ով։"
  },
  {
    keywords: ['մեծածախ', 'metxacax', 'wholesale', 'bulk', 'շատ հատ', 'shat hat', 'mets qanak'],
    answer: "📦 **Մեծածախ վաճառք**.\n\n✅ Մեր կայքը մասնագիտացված է **մեծածախ վաճառքի** մեջ\n✅ Բոլոր գները **մեծածախ** են\n✅ Հնարավոր է նվազագույն քանակի պահանջ\n\n📞 Մեծ պատվերների համար կապնվեք ադմինիստրատորի հետ։"
  },
  {
    keywords: ['նոր ապրանք', 'nor apranq', 'new product', 'addrc', 'ավելացված', 'avelacvac', 'last', 'վերջին'],
    answer: "🆕 **Նոր ապրանքներ**.\n\nԳլխավոր էջում **«Արագ առաջարկ»** բաժնում կարող եք տեսնել վերջին ավելացված ապրանքները։\n\n📲 Կանոնավոր այցելեք կայք՝ նոր տեսականուն ծանոթանալու համար։"
  },

  // ============ ԳԻՆ ============
  {
    keywords: ['գին', 'price', 'արժե', 'փող', 'դրամ', 'gin', 'arje', 'pogh', 'dram'],
    answer: "💰 **Գների** մասին.\n\n✅ Յուրաքանչյուր ապրանքի գինը նշված է **դրամով (֏)**\n✅ Ունենք **մեծածախ** գներ\n✅ Պրոմոկոդներով լրացուցիչ **զեղչեր**\n\n📊 Ընդհանուր գումարը ավտոմատ հաշվարկվում է զամբյուղում։"
  },

  // ============ ՈՐՈՆՈՒՄ ============
  {
    keywords: ['փնտրել', 'search', 'որոնում', 'գտնել', 'կոդ', 'pntrel', 'voronum', 'gtnel'],
    answer: "🔍 **Որոնում**.\n\n1️⃣ Մտեք ցանկացած բաժին (Կոշիկներ/Հողաթափեր)\n2️⃣ Օգտվեք վերևի **«Փնտրել ապրանքը...»** դաշտից 🔎\n3️⃣ Կարող եք փնտրել՝\n   • Ապրանքի անունով\n   • Կոդով (օր.՝ 0019)\n\n⚡ Արդյունքները կցուցադրվեն անմիջապես։"
  },

  // ============ ՆԱՎԻԳԱՑԻԱ ============
  {
    keywords: ['բջջային', 'mobile', 'հեռախոս', 'նավիգացիա', 'մենյու', 'bjjayin', 'navigacia', 'menyu'],
    answer: "📱 **Կայքի նավիգացիա**.\n\n⬇️ Ներքևի նավիգացիոն տողում կան՝\n\n🏠 **ԳԼԽԱՎՈՐ** — Հիմնական էջ\n📤 **ԿԻՍՎԵԼ** — Զամբյուղը Viber/WhatsApp/Telegram-ով ուղարկել\n🤖 **ԱԻ** — AI օգնականը բացել\n🛒 **ԶԱՄԲՅՈՒՂ** — Ձեր ընտրած ապրանքները\n👤 **ԱԴՄԻՆ** — Մուտք (միայն ադմինի համար)\n\n💡 Տեսականին դիտելու համար գլխավոր էջում սեղմեք **«ԴԻՏԵԼ ՏԵՍԱԿԱՆԻՆ»**։"
  },
  {
    keywords: ['գլխավոր', 'glxavor', 'home', 'home page', 'glxavor ej', 'հիմնական էջ', 'him@nakananej'],
    answer: "🏠 **Գլխավոր էջ**.\n\nԳլխավոր էջում կարող եք՝\n\n• Սեղմել **«ԴԻՏԵԼ ՏԵՍԱԿԱՆԻՆ»** — ամբողջ տեսականին դիտելու\n• Տեսնել **«Ինչու՞ ընտրել մեզ»** բաժինը\n• Ծանոթանալ **արագ առաջարկ** ապրանքներին\n\n📱 Կտտացրեք **«ԳԼԽԱՎՈՐ»**-ը ներքևի մենյուում՝ վերադառնալու համար։"
  },
  {
    keywords: ['բաժիններ', 'bajinner', 'categories', 'sections', 'menu', 'разделы'],
    answer: "📂 **Բաժիններ**.\n\nԿայքն ունի երկու հիմնական բաժին՝\n\n👟 **ՍՊՈՐՏԱՅԻՆ ԿՈՇԻԿՆԵՐ** — սեղմեք «ԴԻՏԵԼ +»\n🩴 **ՀՈՂԱԹԱՓԵՐ** — սեղմեք «ԴԻՏԵԼ +»\n\n💡 Այս էջին հասնելու համար՝ գլխավոր էջում սեղմեք **«ԴԻՏԵԼ ՏԵՍԱԿԱՆԻՆ»** կոճակը (կամ համակարգչում՝ վերևի **«Ապրանքներ»** հղումը)։"
  },
  {
    keywords: ['ադմին', 'admin', 'administrator', 'ادمین', 'ադմինիստրատոր', 'administratori'],
    answer: "👤 **Ադմին բաժին**.\n\nԱդմին բաժինը նախատեսված է **կայքի կառավարման** համար։\n\n🔐 Մուտք գործելու համար անհրաժեշտ է **գաղտնաբառ**։\n\n⚠️ Սա **միայն** ադմինիստրատորների համար է։\n\n📞 Հաճախորդների հարցերի համար կապնվեք **Viber/WhatsApp/Telegram**-ով։"
  },
  {
    keywords: ['հետ', 'het', 'back', 'назад', 'նախորդ', 'naxord', 'վերադառնալ', 'veradarnnal'],
    answer: "⬅️ **Հետ գնալ**.\n\nՍեղմեք **«‹ ՀԵՏՆ»** կոճակը էջի վերևի ձախ անկյունում՝ նախորդ էջ վերադառնալու համար։"
  },

  // ============ ԿԱՊ / SOCIAL ============
  {
    keywords: ['viber', 'вайбер', 'vajber', 'viber number', 'viber@ vorinj e'],
    answer: "💜 **Viber**-ով կապ.\n\nԶամբյուղում ավելացրեք գոնե 1 ապրանք, ապա սեղմեք **«ԿԻՍՎԵԼ»** բաժնի Viber կոճակը։\n\n✅ Ձեր ընտրած ապրանքների ցանկն ու նկարը ուղիղ կուղարկվի ադմինիստրատորին։"
  },
  {
    keywords: ['telegram', 'телеграм', 'telegram@ vorinj e', 'телеграм канал'],
    answer: "🔵 **Telegram**-ով կապ.\n\nԶամբյուղում ավելացրեք գոնե 1 ապրանք, ապա սեղմեք **«ԿԻՍՎԵԼ»** բաժնի Telegram կոճակը։\n\n✅ Հարմար է զամբյուղի պատկերն ու ցանկը ուղարկելու համար։"
  },
  {
    keywords: ['whatsapp', 'вацап', 'vacap', 'whatsapp@ vorinj e'],
    answer: "💚 **WhatsApp**-ով կապ.\n\nԶամբյուղում ավելացրեք գոնե 1 ապրանք, ապա սեղմեք **«ԿԻՍՎԵԼ»** բաժնի WhatsApp կոճակը։\n\n✅ Հարմար է ապրանքների ցանկն ու ընդհանուր գումարը ուղարկելու համար։"
  },

  // ============ ԱՌԱՔՈՒՄ ============
  {
    keywords: ['առաքում', 'delivery', 'urd', 'ժամանակ', 'jerb', 'aracum', 'доставка', 'dostaka'],
    answer: "🚚 **Առաքման** մասին.\n\n✅ Առաքում ամբողջ **Հայաստանով**\n✅ Առաքման ժամկետները և ծախսերը կախված են տարածքից\n\n📞 Մանրամասների համար կապնվեք ադմինիստրատորի հետ **Viber/Telegram**-ով զամբյուղը կիսելուց հետո։"
  },
  {
    keywords: ['երբ կհասնի', 'jerb kahasni', 'delivery time', 'ժամկետ', 'jamket', 'oրեր', 'orer', 'delivery days'],
    answer: "📅 **Առաքման ժամկետ**.\n\nԱռաքման ժամկետները կախված են **ձեր գտնվելու վայրից**։\n\n📞 Ճշգրիտ ժամկետի համար, պատվերը հաստատելուց հետո, կապնվեք ադմինիստրատորի հետ **Viber/WhatsApp/Telegram**-ով։"
  },
  {
    keywords: ['առաքման գին', 'aracman gin', 'delivery cost', 'delivery price', 'arakeluc arje', 'արժե առաքումը'],
    answer: "💸 **Առաքման արժեք**.\n\nԱռաքման արժեքը կախված է **հեռավորությունից** և **ծավալից**։\n\n📞 Ճշգրիտ գնի համար կապնվեք ադմինիստրատորի հետ պատվերը հաստատելուց հետո։"
  },

  // ============ ՎՃԱՐՈՒՄ ============
  {
    keywords: ['վճարում', 'payment', 'ինչպես վճարել', 'քարտ', 'vjarum', 'inchpes vjarim', 'kart', 'cash', 'կանխիկ'],
    answer: "💳 **Վճարում**.\n\n🎯 Վճարման եղանակները կքննարկվեն պատվեր հաստատելուց հետո։\n\n📞 Պատվերը հաստատեք և կապնվեք ադմինիստրատորի հետ՝\n• **Viber**\n• **WhatsApp**\n• **Telegram**\n\nԱնհրաժեշտ տեղեկությունները կտրամադրվեն։"
  },

  // ============ AI CHAT ============
  {
    keywords: ['chat', 'chatbot', 'ai', 'bot', 'chet', 'ai ognakanin', 'AI օգնական', 'chatter'],
    answer: "🤖 **AI Օգնական**.\n\nԵս **EdgSport**-ի AI օգնականն եմ։ Կարող եմ պատասխանել հարցերին՝\n\n• 🛒 Զամբյուղի օգտագործում\n• 📦 Ապրանքների մասին\n• 🚚 Առաքման մասին\n• 💳 Վճարման մասին\n• 🔍 Կայքի նավիգացիա\n\n💬 Հարցրեք ցանկացած հարց!"
  },
  {
    keywords: ['offline', 'online', 'available', 'aշխատում', 'ashxatum', 'ov e', 'kchat'],
    answer: "🟢 **Կայքի կարգավիճակ**.\n\nAI Օգնականը **Offline** ռեժիմում աշխատում է ձեր հաճախ տրվող հարցերի հիման վրա։\n\n📞 Բարդ հարցերի համար կապնվեք **ադմինիստրատորի** հետ՝ Viber/WhatsApp/Telegram-ով։"
  },

  // ============ ՏԵԽՆԻԿԱԿԱՆ ============
  {
    keywords: ['սխալ', 'error', 'չի աշխատում', 'խնդիր', 'bug', 'sxal', 'chi ashxatum', 'xndir'],
    answer: "⚠️ **Տեխնիկական խնդիր**.\n\n🔧 Եթե կայքում խնդիր եք հայտնաբերել՝\n\n1️⃣ Փորձեք թարմացնել էջը **(F5)**\n2️⃣ Մաքրեք browser-ի **cache**-ը\n3️⃣ Փորձեք **այլ browser**-ով\n\n📞 Եթե խնդիրը շարունակվում է՝ կապնվեք ադմինիստրատորի հետ։"
  },
  {
    keywords: ['թարմացնել', 'tarmaсnel', 'refresh', 'reload', 'f5', 'update page'],
    answer: "🔄 **Էջի թարմացում**.\n\n• Ստեղնաշարով սեղմեք **F5**\n• Կամ browser-ի **թարմացնել** կոճակը (🔄)\n• Բջջայինում՝ քաշեք էջը **վար** (pull to refresh)\n\n💡 Թարմացումը օգտակար է, երբ ապրանքները կամ նկարները ճիշտ չեն բացվում։"
  },
  {
    keywords: ['kcapat', 'կայք', 'kayk', 'website', 'app', 'application', 'կայքը', 'kayk@'],
    answer: "🌐 **EdgSport կայք**.\n\nՄեր կայքը հասանելի է՝ **my-shop-app-on2e.onrender.com**\n\n📱 Հարմարեցված է **բջջային** և **desktop** սարքերի համար։\n\n💡 Լավագույն փորձի համար օգտագործեք **Chrome** կամ **Safari** browser։"
  },

  // ============ ԸՆԴՀԱՆՈՒՐ ============
  {
    keywords: ['շնորհակալ', 'shnorhakal', 'merci', 'thanks', 'thank you', 'спасибо'],
    answer: "😊 **Խնդրեմ!**\n\nՈւրախ եմ, որ կարողացա օգնել։ Եթե ունեք ևս հարցեր, ազատ հարցրեք! 🎉"
  },
  {
    keywords: ['bye', 'ցտեսություն', 'ctesutyun', 'goodbye', 'до свидания', 'das vidaniya'],
    answer: "👋 **Ցտեսություն!**\n\nՇնորհակալ ենք **EdgSport** այցելելու համար։ Հաջող գնումներ! 🛍️"
  },
  {
    keywords: ['ով եք', 'ov eq', 'who are you', 'ինչ ես', 'inch es', 'EdgSport', 'edgsport', 'մեր մասին', 'mer masin', 'about us'],
    answer: "🏪 **EdgSport-ի մասին**.\n\n**EdgSport**-ը մեծածախ սպորտային կոշիկների և հողաթափերի **առցանց խանութ** է։\n\n✅ Բարձրորակ ապրանքներ\n✅ Մեծածախ գներ\n✅ Արագ առաքում Հայաստանով\n\n📞 Կապ՝ **Viber / WhatsApp / Telegram**"
  },
  {
    keywords: ['ուզում եմ ուղղակի հարցնել', 'հարց ունեմ', 'question without order', 'uzum em harcnel', 'ուղիղ մարդու հետ խոսել', 'human support', 'canonakan hartsum'],
    answer: "💬 **Ուղիղ հարց ադմինիստրատորին**.\n\nԵս կարող եմ պատասխանել կայքի օգտագործման հարցերին անմիջապես այստեղ։\n\n📞 Իսկ եթե ուզում եք **կենդանի մարդու** հետ խոսել՝ ավելացրեք ցանկացած ապրանք զամբյուղ և օգտվեք **Viber/WhatsApp/Telegram** «ԿԻՍՎԵԼ» կոճակներից՝ ուղիղ կապ հաստատելու համար։"
  },
  {
    keywords: ['վստահելի է', 'իրական խանութ է', 'is it legit', 'real store', 'vstaheli e', 'xabvac chi lini', 'չեմ խաբվի'],
    answer: "🛡️ **Կայքի մասին վստահություն**.\n\n**EdgSport**-ը իրական մեծածախ վաճառքի կայք է՝ ապրանքների նկարներով, կոդերով և գներով։\n\n✅ Պատվերը հաստատվում է միայն ձեր տվյալները լրացնելուց և ադմինիստրատորի հետ **Viber/WhatsApp/Telegram**-ով կապ հաստատելուց հետո՝ այնպես որ կարող եք ամեն ինչ նախապես ճշտել։"
  }
];

// Ավելի խելացի LOCAL search функция
const getAssistantResponse = (query: string, products: any[]) => {
  const lowerQuery = query.toLowerCase().trim();
  
  // Առաջին՝ ստուգել FAQ-ում
  for (const item of FAQ_DATA) {
    if (item.keywords.some(key => lowerQuery.includes(key.toLowerCase()))) {
      return item.answer;
    }
  }

  // Երկրորդ՝ ստուգել ապրանքների անուններ և կոդեր
  const foundProducts = products.filter(p => 
    lowerQuery.includes(p.code.toLowerCase()) || 
    lowerQuery.includes(p.name.toLowerCase())
  ).slice(0, 3);

  if (foundProducts.length > 0) {
    let resp = "🔍 **Գտնված ապրանքներ**\n\n";
    foundProducts.forEach(p => {
      resp += `🔹 **${p.name}**\n💰 Գին՝ **${p.price.toLocaleString()} ֏**\n🔢 Կոդ՝ **${p.code}**\n${p.category === 'sneakers' ? '👟 Սպորտային կոշիկ' : '🥿 Հողաթափ'}\n\n`;
    });
    resp += "💡 Ապրանքները ավելացնելու համար մտեք համապատասխան բաժին և սեղմեք **«ՈՒՂՂԱՐԿԵԼ ԶԱＭՅՈՒՂ»**։";
    return resp;
  }

  // Եթե ոչինչ չգտավ
  return "🤔 Ներողություն, ես չկարողացա գտնել կոնկրետ պատասխան ձեր հարցին։\n\n💡 **Հնարավոր է...**\n• AI համակարգը ժամանակավորապես անհասանելի է\n• Լիմիտը սպառվել է\n\n📞 Խնդրում եմ փորձեք մի փոքր ուշ կամ կապնվեք ադմինիստրատորի հետ։";
};

export function AIAssistant({ products = [], openRef }: { products?: any[]; openRef?: React.MutableRefObject<(() => void) | null> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: '👋 Ողջույն! Ես ձեր AI օգնականն եմ։ Ինչպե՞ս կարող եմ օգնել ձեզ այսօր։' 
    }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const hasBeenWelcomed = localStorage.getItem('ai_assistant_welcomed');
    if (!hasBeenWelcomed) {
      const timer = setTimeout(() => {
        setShowBubble(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (openRef) {
      openRef.current = () => {
        setShowBubble(false);
        setIsOpen(true);
      };
      return () => { openRef.current = null; };
    }
  }, [openRef]);

  const handleToggle = () => {
    if (!isOpen && showBubble) {
      closeBubble();
    }
    setIsOpen(!isOpen);
  };

  const closeBubble = () => {
    setShowBubble(false);
    localStorage.setItem('ai_assistant_welcomed', 'true');
  };

  const handleSend = async () => {
    if (!userMessage.trim() || isLoading) return;

    const inputMessage = userMessage.trim();
    setIsLoading(true);
    setUserMessage('');
    setMessages(prev => [...prev, { role: 'user', content: inputMessage }]);

    // Փոքր, բնական հապաղում՝ որպեսզի «Մտածում եմ...» անիմացիան երևա
    // (իրական մշակում չկա՝ ամեն ինչ ընթանում է local Հ/Հ բազայից)
    await new Promise(resolve => setTimeout(resolve, 450 + Math.random() * 350));

    const response = getAssistantResponse(inputMessage, products);

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsLoading(false);
  };

  return (
    <>
      <div className="relative">
        <AnimatePresence>
          {showBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute -bottom-16 right-0 bg-white text-gray-900 px-3 py-2 rounded-2xl shadow-2xl border border-gray-200 max-w-[200px] z-[100]"
            >
              <button
                onClick={(e) => { e.stopPropagation(); closeBubble(); }}
                className="absolute -top-2 -left-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-lg z-[110]"
              >
                <X size={12} />
              </button>
              <p className="text-[11px] sm:text-xs font-bold leading-tight text-gray-800">
                Ողջույն! Ես ձեր AI օգնականն եմ։ Կարո՞ղ եմ օգնել ձեզ։
              </p>
              <div className="absolute -top-2 right-4 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-200" />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToggle();
          }}
          className="relative p-2 hover:bg-white/10 rounded-full transition-colors group cursor-pointer z-[70]"
          title="AI Օգնական"
          type="button"
        >
          <MessagesSquare size={20} className="text-white/80 group-hover:text-white transition-colors" />
          <Sparkles size={10} className="absolute top-1 right-1 text-yellow-400 animate-pulse" />
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[10000] flex flex-col sm:items-end sm:justify-start sm:p-4 sm:pt-20 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
              />
              
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 50, scale: 0.95, filter: 'blur(10px)' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full h-full sm:w-[400px] sm:h-[calc(100vh-120px)] sm:max-h-[700px] bg-[#09090b] border-none sm:border sm:border-white/10 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
              >
              <div className="p-4 bg-gradient-to-r from-[#3b82f6] to-[#f97316] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-white">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">AI Օգնական</h3>
                    <p className="text-[10px] opacity-80">Միշտ պատրաստ oգնելու</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors text-white"
                >
                  <X size={20} />
                </button>
              </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0">
                  {messages.map((msg, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`mt-1 p-1 rounded-full flex-shrink-0 h-fit ${msg.role === 'user' ? 'bg-[#3b82f6]' : 'bg-[#f97316]'}`}>
                          {msg.role === 'user' ? <User size={12} className="text-white" /> : <Bot size={12} className="text-white" />}
                        </div>
                        <div className={`p-3 rounded-2xl text-sm markdown-content shadow-lg ${
                          msg.role === 'user' 
                            ? 'bg-[#3b82f6] text-white rounded-tr-none' 
                            : 'bg-zinc-800 text-white border border-white/10 rounded-tl-none'
                        }`}>
                          <ReactMarkdown>{DOMPurify.sanitize(msg.content)}</ReactMarkdown>
                          {isLoading && idx === messages.length - 1 && msg.role === 'assistant' && (
                            <span className="typing-cursor" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex gap-2 items-center bg-zinc-800 border border-white/10 p-3 rounded-2xl rounded-tl-none shadow-lg">
                        <Loader2 size={14} className="animate-spin text-[#f97316]" />
                        <span className="text-xs text-gray-300">Մտածում եմ...</span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} className="h-2" />
                </div>

              <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Գրեք ձեր հարցը..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-12 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3b82f6] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!userMessage.trim() || isLoading}
                    className="absolute right-1.5 p-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:hover:bg-[#3b82f6] text-white rounded-lg transition-all"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .markdown-content img {
          max-width: 100%;
          max-height: 400px;
          object-fit: contain;
          border-radius: 12px;
          margin: 12px 0;
          border: 2px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }
        .markdown-content p {
          margin-bottom: 8px;
        }
        .markdown-content p:last-child {
          margin-bottom: 0;
        }
        .typing-cursor::after {
          content: '▋';
          display: inline-block;
          vertical-align: middle;
          animation: blink 1s step-end infinite;
          margin-left: 2px;
          color: #f97316;
        }
        @keyframes blink {
          from, to { opacity: 1; }
          50% { opacity: 0; }
        }
      `}} />
    </>
  );
}
