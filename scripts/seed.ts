import 'dotenv/config';
import { getDb } from '@/lib/db/mongodb';
import { COLLECTIONS } from '@/lib/db/collections';
import { toSlug } from '@/lib/utilities/slug';
import { calculateReadingTime } from '@/lib/utilities/reading-time';
import { contentBlocksSchema, type ContentBlock } from '@/models/content-block.model';
import type { SeriesDocument } from '@/models/series.model';
import type { ModuleDocument } from '@/models/module.model';
import { episodeAudioSchema, type EpisodeDocument } from '@/models/episode.model';
import { ensureAllIndexes } from './ensure-indexes';

const SEED_ACTOR = 'seed-script';

/**
 * Episode 1 — "Machine Learning Mein Data Ki Aukaat". This is the show's
 * actual first scene (Sunday subah, Salim ke dining table par), covering
 * GIGO, data objects, and attributes before teasing the next Sunday's
 * nominal/ordinal/interval/ratio episode.
 *
 * Safe to re-run: upserts series/module/episode by slug rather than
 * inserting duplicates.
 */
const contentBlocks: ContentBlock[] = [
  {
    id: 'scene-dining-table',
    type: 'scene',
    order: 0,
    sceneTitle: 'Salim Ke Ghar Ka Dining Table',
    location: "Salim's dining table",
    time: 'Sunday, 11:00 AM',
    sessionLabel: 'Module 2 · Episode 1',
    backgroundTheme: 'neutral',
    ambientDescription:
      'Dining table par laptop khula hai, saamne ek notebook, do pens aur chai ka ek cup — jo padhai shuru hone se pehle hi thanda ho chuka hai.',
    transitionStyle: 'fade',
  },
  {
    id: 'narration-entry',
    type: 'narration',
    order: 1,
    tone: 'scene-setting',
    bodyMarkdown:
      'Tabhi Shyam bina bell bajaye darwaza kholkar andar aa gaya. "Ammi! Salim ghar par hai kya?" Andar se awaaz aayi — Salim ki Ammi: "Dining table par baitha hai. Pata nahi Sunday ke din kaunsi duniya bacha raha hai."',
  },
  {
    id: 'dialogue-washing-machine',
    type: 'dialogue',
    order: 2,
    lines: [
      { id: 'd1', speaker: 'shyam', text: 'Ye kya kar raha hai bhai?', emphasis: 'none', displayOrder: 0 },
      { id: 'd2', speaker: 'salim', text: 'Machine Learning padh raha hoon.', emphasis: 'none', displayOrder: 1 },
      { id: 'd3', speaker: 'shyam', text: 'Tu?', emphasis: 'none', displayOrder: 2 },
      { id: 'd4', speaker: 'salim', text: 'Haan, main.', emphasis: 'none', displayOrder: 3 },
      { id: 'd5', speaker: 'shyam', text: 'Machine Learning?', emphasis: 'none', displayOrder: 4 },
      { id: 'd6', speaker: 'salim', text: 'Haan bhai!', emphasis: 'none', displayOrder: 5 },
      {
        id: 'd7',
        speaker: 'shyam',
        text: 'Pehle washing machine chalana seekh le. Pichhli baar white shirt ke saath red towel daal diya tha.',
        reaction: 'smirk',
        emphasis: 'none',
        displayOrder: 6,
      },
      { id: 'd8', speaker: 'salim', text: 'Ek baar galti hui thi!', emphasis: 'none', displayOrder: 7 },
      {
        id: 'd9',
        speaker: 'shyam',
        text: 'Galti nahi thi. Feature engineering thi. White shirt se pink shirt create kar di tune.',
        emphasis: 'bold',
        displayOrder: 8,
      },
      {
        id: 'd10',
        speaker: 'salim',
        text: 'Tu padhane aaya hai ya meri beizzati karne?',
        emphasis: 'none',
        displayOrder: 9,
      },
      {
        id: 'd11',
        speaker: 'shyam',
        text: 'Purana dost ka farz hai dono karna.',
        emphasis: 'none',
        displayOrder: 10,
      },
    ],
  },
  {
    id: 'narration-chai-pakode',
    type: 'narration',
    order: 3,
    tone: 'ambient',
    bodyMarkdown: 'Itne mein Salim ki Ammi chai aur pakode rakh gayin.',
  },
  {
    id: 'dialogue-pakoda-analogy',
    type: 'dialogue',
    order: 4,
    lines: [
      {
        id: 'd12',
        speaker: 'salim',
        text: 'Chal, mazaak chhod. Ye bata Machine Learning mein sab log bolte kyun hain ki data bahut important hai? Algorithm intelligent hai na? Khud samajh lega.',
        emphasis: 'none',
        displayOrder: 0,
      },
      {
        id: 'd13',
        speaker: 'shyam',
        text: 'Achha, maan le Aunty pakode banate waqt fresh aloo ki jagah sade hue aloo use kar leti hain.',
        stageDirection: 'ek pakoda uthaate hue',
        emphasis: 'none',
        displayOrder: 1,
      },
      { id: 'd14', speaker: 'salim', text: 'Ammi kabhi aisa nahi karengi.', emphasis: 'none', displayOrder: 2 },
      {
        id: 'd15',
        speaker: 'shyam',
        text: 'Example hai bhai. Har baat par family ki izzat bachane mat lag ja.',
        emphasis: 'none',
        displayOrder: 3,
      },
      { id: 'd16', speaker: 'salim', text: 'Achha, bol.', emphasis: 'none', displayOrder: 4 },
      {
        id: 'd17',
        speaker: 'shyam',
        text: 'Agar ingredient kharab hai, to recipe kitni bhi achhi ho, pakoda kaisa banega?',
        emphasis: 'none',
        displayOrder: 5,
      },
      { id: 'd18', speaker: 'salim', text: 'Kharab.', emphasis: 'none', displayOrder: 6 },
      {
        id: 'd19',
        speaker: 'shyam',
        text: 'Bas. Machine Learning mein bhi same scene hai. Data ingredient hai aur ML algorithm recipe hai. Agar data galat hai, incomplete hai ya inconsistent hai, to duniya ka best algorithm bhi reliable prediction nahi de sakta. Isko bolte hain: Garbage In, Garbage Out.',
        emphasis: 'bold',
        conceptRef: 'garbage-in-garbage-out',
        displayOrder: 7,
      },
    ],
  },
  {
    id: 'concept-gigo',
    type: 'concept',
    order: 5,
    conceptName: 'Garbage In, Garbage Out (GIGO)',
    anchorId: 'garbage-in-garbage-out',
    simpleDefinition:
      'Agar model ko galat ya ganda data doge, toh model bhi galat predictions hi dega — chahe algorithm kitna bhi achha ho.',
    technicalDefinition:
      'A principle stating that the quality of a model’s output is fundamentally bounded by the quality of its input data; no algorithm can compensate for systematically flawed, incomplete, or mislabeled training data.',
    realWorldExample:
      'Pakode ka ingredient (aloo) kharab ho to recipe kitni bhi achhi ho, pakoda kharab hi banega — data bhi ML ka "ingredient" hai, algorithm uski "recipe".',
    relatedTerms: ['data quality', 'data cleaning', 'bias'],
    bookmarkable: true,
  },
  {
    id: 'banter-model-dost-nahi',
    type: 'banter',
    order: 6,
    speaker: 'shyam',
    text: 'Bas model tera dost nahi hai, jo bolega, "Bhai, tera data suspicious lag raha hai."',
    reactionEmoji: '🤷',
  },
  {
    id: 'dialogue-placement-setup',
    type: 'dialogue',
    order: 7,
    lines: [
      {
        id: 'd20',
        speaker: 'salim',
        text: 'Matlab model ko kachra denge, to model bhi kachra hi lautayega?',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'd21', speaker: 'salim', text: 'Model blindly maan lega?', emphasis: 'none', displayOrder: 1 },
      {
        id: 'd22',
        speaker: 'shyam',
        text: 'Mostly haan. Maan le hum ek model bana rahe hain jo students ka placement predict karega. Data kuch aisa hai:',
        emphasis: 'none',
        displayOrder: 2,
      },
    ],
  },
  {
    id: 'table-placement-dataset',
    type: 'table',
    order: 8,
    caption: 'Placement prediction ke liye raw dataset',
    columns: ['Name', 'CGPA', 'Coding Score', 'Placed'],
    rows: [
      ['Aman', '8.5', '85', 'Yes'],
      ['Neha', '9.0', '92', 'Yes'],
      ['Rohit', '-20', '5000', 'No'],
      ['Sara', '7.8', 'Missing', 'Yes'],
    ],
    note: 'Ab bata, problem kya hai?',
  },
  {
    id: 'dialogue-spot-the-garbage',
    type: 'dialogue',
    order: 9,
    lines: [
      {
        id: 'd23',
        speaker: 'salim',
        text: 'Rohit ki CGPA -20 kaise ho sakti hai?',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'd24', speaker: 'shyam', text: 'Sahi.', emphasis: 'none', displayOrder: 1 },
      {
        id: 'd25',
        speaker: 'salim',
        text: 'Aur coding score 5000 bhi ajeeb hai. Ye coding test de raha tha ya IPL mein batting kar raha tha?',
        emphasis: 'none',
        displayOrder: 2,
      },
      {
        id: 'd26',
        speaker: 'shyam',
        text: 'Exactly. Aur Sara ka coding score missing hai.',
        emphasis: 'none',
        displayOrder: 3,
      },
      {
        id: 'd27',
        speaker: 'salim',
        text: 'To training se pehle ye sab clean karna padega?',
        emphasis: 'none',
        displayOrder: 4,
      },
      {
        id: 'd28',
        speaker: 'shyam',
        text: 'Haan. Machine Learning ka glamorous part model banana hai, lekin real life mein kaafi time data samajhne aur clean karne mein nikalta hai.',
        emphasis: 'none',
        displayOrder: 5,
      },
    ],
  },
  {
    id: 'dialogue-ethics-joke',
    type: 'dialogue',
    order: 10,
    lines: [
      {
        id: 'd29',
        speaker: 'salim',
        text: 'Ye to wahi baat ho gayi jab school mein tu attendance register mein mera naam present kar deta tha.',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'd30', speaker: 'shyam', text: 'Woh data cleaning nahi thi.', emphasis: 'none', displayOrder: 1 },
      { id: 'd31', speaker: 'salim', text: 'Phir?', emphasis: 'none', displayOrder: 2 },
      { id: 'd32', speaker: 'shyam', text: 'Data manipulation thi.', emphasis: 'none', displayOrder: 3 },
      {
        id: 'd33',
        speaker: 'salim',
        text: 'Aur tu aaj mujhe ethics sikha raha hai!',
        emphasis: 'none',
        displayOrder: 4,
      },
    ],
  },
  {
    id: 'divider-thodi-der-baad',
    type: 'divider',
    order: 11,
    style: 'chai-cup',
    label: 'Thodi der baad',
  },
  {
    id: 'dialogue-attendance-register',
    type: 'dialogue',
    order: 12,
    lines: [
      {
        id: 'd34',
        speaker: 'salim',
        text: 'Achha, data important samajh aa gaya. Ab ye "data object" aur "attribute" kya hote hain?',
        emphasis: 'none',
        displayOrder: 0,
      },
      {
        id: 'd35',
        speaker: 'shyam',
        text: 'School ka attendance register yaad hai?',
        conceptRef: 'data-object',
        emphasis: 'none',
        displayOrder: 1,
      },
      {
        id: 'd36',
        speaker: 'salim',
        text: 'Haan. Jisme mera naam aksar absent likha hota tha.',
        emphasis: 'none',
        displayOrder: 2,
      },
      { id: 'd37', speaker: 'shyam', text: 'Kyunki tu aksar absent hota tha.', emphasis: 'none', displayOrder: 3 },
      {
        id: 'd38',
        speaker: 'salim',
        text: 'Main physically absent hota tha. Spiritually class mein hi hota tha.',
        emphasis: 'none',
        displayOrder: 4,
      },
      {
        id: 'd39',
        speaker: 'shyam',
        text: 'Teri spirit bhi lunch break ke baad aati thi.',
        emphasis: 'none',
        displayOrder: 5,
      },
    ],
  },
  {
    id: 'table-student-dataset',
    type: 'table',
    order: 13,
    caption: 'Ek chhota sa student dataset',
    columns: ['Name', 'Age', 'City', 'CGPA'],
    rows: [
      ['Salim', '27', 'Bengaluru', '8.2'],
      ['Shyam', '27', 'Lucknow', '8.5'],
      ['Aman', '26', 'Delhi', '7.9'],
    ],
  },
  {
    id: 'dialogue-row-column',
    type: 'dialogue',
    order: 14,
    lines: [
      {
        id: 'd40',
        speaker: 'shyam',
        text: 'Is table mein Salim wali poori row kya represent kar rahi hai?',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'd41', speaker: 'salim', text: 'Ek person ko.', emphasis: 'none', displayOrder: 1 },
      {
        id: 'd42',
        speaker: 'shyam',
        text: 'Correct. Dataset mein ek single person, item ya event ko hum data object bolte hain.',
        conceptRef: 'data-object',
        emphasis: 'bold',
        displayOrder: 2,
      },
      { id: 'd43', speaker: 'salim', text: 'Matlab meri poori row ek data object hai?', emphasis: 'none', displayOrder: 3 },
      { id: 'd44', speaker: 'shyam', text: 'Haan.', emphasis: 'none', displayOrder: 4 },
      { id: 'd45', speaker: 'salim', text: 'Aur column?', emphasis: 'none', displayOrder: 5 },
      {
        id: 'd46',
        speaker: 'shyam',
        text: 'Column ko attribute ya feature bolte hain.',
        conceptRef: 'attribute',
        emphasis: 'bold',
        displayOrder: 6,
      },
      {
        id: 'd47',
        speaker: 'salim',
        text: 'To simple language mein: Row batati hai kiske baare mein data hai, aur column batata hai uske baare mein kya information hai.',
        emphasis: 'none',
        displayOrder: 7,
      },
      {
        id: 'd48',
        speaker: 'shyam',
        text: 'Wah! Kabhi-kabhi tu intelligent baat bhi kar leta hai.',
        emphasis: 'none',
        displayOrder: 8,
      },
      { id: 'd49', speaker: 'salim', text: 'Machine Learning ka effect hai.', emphasis: 'none', displayOrder: 9 },
      {
        id: 'd50',
        speaker: 'shyam',
        text: 'Abhi model train bhi nahi hua aur overconfidence aa gaya.',
        emphasis: 'none',
        displayOrder: 10,
      },
    ],
  },
  {
    id: 'concept-data-object',
    type: 'concept',
    order: 15,
    conceptName: 'Data Object',
    anchorId: 'data-object',
    simpleDefinition: 'Dataset ki ek single row — ek person, item ya event jiske baare mein data collect kiya gaya hai.',
    technicalDefinition:
      'A single entity or record in a dataset, described by a set of attributes. Also called an object, instance, sample, record, or observation. In a tabular dataset, one data object typically corresponds to one row.',
    realWorldExample:
      'Attendance register mein, har student ek "data object" hai — uska naam, age, city aur CGPA uski properties hain.',
    relatedTerms: ['object', 'instance', 'sample', 'record', 'observation'],
    bookmarkable: true,
  },
  {
    id: 'concept-attribute',
    type: 'concept',
    order: 16,
    conceptName: 'Attribute',
    anchorId: 'attribute',
    simpleDefinition: 'Ek data object ki koi bhi measurable property — jaise uska naam, uski age, ya uska status.',
    technicalDefinition:
      'A measurable property or characteristic of a data object, typically represented as a column in a tabular dataset. Also called a feature or variable.',
    realWorldExample: 'Student dataset mein "Name", "Age", "City" aur "CGPA" — har column ek attribute hai.',
    relatedTerms: ['feature', 'column', 'variable'],
    bookmarkable: true,
  },
  {
    id: 'dialogue-netflix-intro',
    type: 'dialogue',
    order: 17,
    lines: [
      {
        id: 'd51',
        speaker: 'shyam',
        text: 'Maan le Netflix ka viewing dataset hai. Har baar jab koi user movie dekhta hai, ek viewing session record hota hai. Ek row kuch aisi ho sakti hai:',
        emphasis: 'none',
        displayOrder: 0,
      },
    ],
  },
  {
    id: 'table-netflix-session',
    type: 'table',
    order: 18,
    caption: 'Netflix viewing session dataset',
    columns: ['User ID', 'Movie ID', 'Start Time', 'Duration Watched'],
    rows: [['U101', 'M505', '08:30 PM', '42 minutes']],
    note: 'Data object: ek individual viewing session. Attributes: User ID, Movie ID, Start time, Duration watched.',
  },
  {
    id: 'dialogue-object-can-be-anything',
    type: 'dialogue',
    order: 19,
    lines: [
      { id: 'd52', speaker: 'salim', text: 'Matlab object hamesha person nahi hota?', emphasis: 'none', displayOrder: 0 },
      {
        id: 'd53',
        speaker: 'shyam',
        text: 'Bilkul nahi. Object kuch bhi ho sakta hai: ek customer, ek transaction, ek email, ek medical report, ek movie-viewing session, ek product, ek website visit. Ye depend karta hai ki dataset kis problem ke liye banaya gaya hai.',
        emphasis: 'none',
        displayOrder: 1,
      },
    ],
  },
  {
    id: 'summary-recap',
    type: 'summary',
    order: 20,
    title: 'Aaj Shyam ne Salim ko kya sikhaya?',
    points: [
      'Data ML ki foundation hai — model wahi seekhega jo data mein available hai.',
      'Garbage In, Garbage Out: galat ya low-quality data ka result unreliable prediction ho sakta hai.',
      'Data Object: dataset ki ek individual row ya observation ko data object kehte hain.',
      'Attribute: kisi object ki measurable property ya column ko attribute kehte hain.',
    ],
  },
  {
    id: 'table-quick-reference',
    type: 'table',
    order: 21,
    caption: 'Quick reference',
    columns: ['Dataset term', 'Bhi jaana jaata hai'],
    rows: [
      ['Row', 'Object / Instance / Record / Sample'],
      ['Column', 'Attribute / Feature'],
    ],
  },
  {
    id: 'quiz-episode-1',
    type: 'quiz',
    order: 22,
    title: 'Pop quiz — pakoda break se pehle',
    questions: [
      {
        id: 'q1',
        questionType: 'multiple-choice',
        prompt: 'Garbage In, Garbage Out ka matlab kya hai?',
        options: [
          { id: 'a', text: 'Zyada data hamesha behtar hota hai' },
          { id: 'b', text: 'Ganda input data, ganda model output deta hai' },
          { id: 'c', text: 'Models kabhi galat nahi hote' },
        ],
        correctOptionId: 'b',
        explanation: 'GIGO ka core idea yeh hai ki model sirf utna hi achha ho sakta hai jitna uska input data.',
      },
      {
        id: 'q2',
        questionType: 'true-false',
        prompt: 'Student dataset mein har student ek "attribute" hai.',
        correctAnswer: false,
        explanation: 'Galat — har student ek "data object" hai. "CGPA" jaisi properties attributes hain.',
      },
      {
        id: 'q3',
        questionType: 'short-answer',
        prompt: 'Ek data object ki property ko kya kehte hain?',
        acceptableAnswers: ['attribute', 'feature', 'attributes', 'features'],
        explanation: 'Isey attribute (ya feature) kehte hain.',
      },
    ],
  },
  {
    id: 'homework-episode-1',
    type: 'homework',
    order: 23,
    dueLabel: 'Agle Sunday tak',
    difficulty: 'easy',
    tasks: [
      'Apne ghar ke kisi bhi "register" (ration card, school diary, etc.) mein 3 data objects aur unke attributes identify karo.',
      'Socho: us data mein koi "garbage" (galat/missing entry) ho sakta hai kya?',
    ],
  },
  {
    id: 'teaser-next-episode',
    type: 'teaser',
    order: 24,
    nextEpisodeTitle: 'Attributes Ki Kisam — Nominal, Ordinal, Interval Aur Ratio',
    teaserText:
      'Agle Sunday: har attribute same type ka nahi hota. Shyam, Salim ko Nominal, Ordinal, Interval aur Ratio attributes samjhayega.',
  },
];

/**
 * Episode 2 — "Bengaluru + Lucknow = ? | Data Ke Types Ki Kahani". Roles
 * flip this week: Salim teaches, Shyam is the student, on Shyam's rooftop.
 * Covers the four attribute types (nominal/ordinal/interval/ratio) and the
 * discrete vs continuous distinction.
 */
const episode2ContentBlocks: ContentBlock[] = [
  {
    id: 's2-scene-rooftop',
    type: 'scene',
    order: 0,
    sceneTitle: "Shyam Ke Ghar Ki Chhat",
    location: "Shyam's rooftop",
    time: 'Sunday, 10:45 AM',
    sessionLabel: 'Module 2 · Episode 2',
    backgroundTheme: 'rooftop-evening',
    ambientDescription:
      'Dhoop thodi tez hai. Plastic ki do kursiyan hain aur beech mein ek stool par Shyam ki Maa ke banaye aloo ke parathe rakhe hain. Is baar padhane ki baari Salim ki hai, aur wo ye baat kisi ko bhoolne nahi dega.',
    transitionStyle: 'fade',
  },
  {
    id: 's2-dialogue-whiteboard',
    type: 'dialogue',
    order: 1,
    lines: [
      {
        id: 'e2d1',
        speaker: 'salim',
        text: 'Chal beta, baith ja. Aaj class main lunga.',
        stageDirection: 'chhat ki purani deewar par lagi whiteboard sheet ko thapthapate hue',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'e2d2', speaker: 'shyam', text: 'Ye whiteboard kahan se laya?', emphasis: 'none', displayOrder: 1 },
      {
        id: 'e2d3',
        speaker: 'salim',
        text: 'Tere hi store room se mila. Pehli class mein jo tune "Shyam Coaching Centre" khola tha, ye usi ka board hai.',
        emphasis: 'none',
        displayOrder: 2,
      },
      { id: 'e2d4', speaker: 'shyam', text: 'Us coaching mein do students the.', emphasis: 'none', displayOrder: 3 },
      {
        id: 'e2d5',
        speaker: 'salim',
        text: 'Ek main tha aur doosri teri chhoti behen, jo fees mein Parle-G deti thi.',
        emphasis: 'none',
        displayOrder: 4,
      },
      { id: 'e2d6', speaker: 'shyam', text: 'Business model solid tha. Ab topic pe aa.', emphasis: 'none', displayOrder: 5 },
    ],
  },
  {
    id: 's2-dialogue-recap',
    type: 'dialogue',
    order: 2,
    lines: [
      {
        id: 'e2d7',
        speaker: 'salim',
        text: 'Pichhle Sunday tune ek sawaal chhoda tha. City, shirt size, temperature aur salary, ye chaaron attributes hain. Sahi?',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'e2d8', speaker: 'shyam', text: 'Haan.', emphasis: 'none', displayOrder: 1 },
      { id: 'e2d9', speaker: 'salim', text: 'To ek kaam kar. Salary add kar.', emphasis: 'none', displayOrder: 2 },
      { id: 'e2d10', speaker: 'shyam', text: '₹50,000 + ₹30,000 = ₹80,000.', emphasis: 'none', displayOrder: 3 },
      {
        id: 'e2d11',
        speaker: 'salim',
        text: 'Ab city add kar. Bengaluru + Lucknow?',
        emphasis: 'none',
        displayOrder: 4,
      },
      {
        id: 'e2d12',
        speaker: 'shyam',
        text: '...Traffic?',
        stageDirection: '5 second ruk ke',
        emphasis: 'none',
        displayOrder: 5,
      },
      {
        id: 'e2d13',
        speaker: 'salim',
        text: 'Bas yahi samajhna hai aaj. Har attribute pe har mathematical operation meaningful nahi hota. Isliye attributes ko categories mein baanta jaata hai.',
        emphasis: 'bold',
        displayOrder: 6,
      },
    ],
  },
  {
    id: 's2-table-four-types',
    type: 'table',
    order: 3,
    caption: 'Attributes ke 4 types',
    columns: ['Type', 'Simple meaning', 'Example'],
    rows: [
      ['Nominal', 'Sirf naam ya label, koi order nahi', 'City, Colour, Blood group'],
      ['Ordinal', 'Category hai aur order bhi hai', 'Grade (A, B, C), Shirt size (S, M, L), Rating'],
      ['Interval', 'Number hai, difference meaningful hai, lekin true zero nahi', 'Temperature in °C, Time of day, IQ score'],
      ['Ratio', 'Number hai aur true zero bhi hai', 'Salary, Age, Height, Weight'],
    ],
    note: 'Ek line mein: har agla type pichhle wale se thoda zyada "mathematical" hai.',
  },
  {
    id: 's2-divider-nominal',
    type: 'divider',
    order: 4,
    style: 'scene-break',
    label: 'Nominal: Bas naam hai, aukaat mat pooch',
  },
  {
    id: 's2-dialogue-nominal',
    type: 'dialogue',
    order: 5,
    lines: [
      {
        id: 'e2d14',
        speaker: 'salim',
        text: 'Nominal ka matlab hai sirf naam. Categories alag hain, lekin unme koi order nahi.',
        conceptRef: 'nominal-attribute',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'e2d15', speaker: 'shyam', text: 'Jaise?', emphasis: 'none', displayOrder: 1 },
      {
        id: 'e2d16',
        speaker: 'salim',
        text: 'Blood group. A+, B+, O+. Bata, kaun bada hai?',
        emphasis: 'none',
        displayOrder: 2,
      },
      {
        id: 'e2d17',
        speaker: 'shyam',
        text: 'O+ universal donor hai, to wo bada.',
        emphasis: 'none',
        displayOrder: 3,
      },
      {
        id: 'e2d18',
        speaker: 'salim',
        text: 'Medical importance alag cheez hai. Value mein koi order nahi hai. "O+ is greater than A+" bolne ka koi matlab nahi banta.',
        emphasis: 'none',
        displayOrder: 4,
      },
      {
        id: 'e2d19',
        speaker: 'shyam',
        text: 'Achha, to nominal ke saath kya kar sakte hain?',
        emphasis: 'none',
        displayOrder: 5,
      },
      {
        id: 'e2d20',
        speaker: 'salim',
        text: 'Bas do cheezein: same hai ya alag hai (= / ≠), aur kaunsi category sabse zyada aayi, yaani mode.',
        emphasis: 'none',
        displayOrder: 6,
      },
      {
        id: 'e2d21',
        speaker: 'shyam',
        text: 'Average blood group nikal sakte hain?',
        emphasis: 'none',
        displayOrder: 7,
      },
      {
        id: 'e2d22',
        speaker: 'salim',
        text: 'Nikal le. Answer aayega "AB-ish". Doctor ko dikha dena.',
        emphasis: 'none',
        displayOrder: 8,
      },
    ],
  },
  {
    id: 's2-concept-nominal',
    type: 'concept',
    order: 6,
    conceptName: 'Nominal Attribute',
    anchorId: 'nominal-attribute',
    simpleDefinition: 'Sirf naam ya label hai — categories alag hain, lekin unme koi order nahi.',
    technicalDefinition:
      'A categorical attribute whose values are distinct labels with no inherent order. Only equality/inequality (=, ≠) and mode are meaningful; arithmetic and ordering are not.',
    realWorldExample: 'Blood group (A+, B+, O+), city, colour — koi bhi value doosri se "bada" nahi hai.',
    relatedTerms: ['categorical', 'label', 'mode'],
    bookmarkable: true,
  },
  {
    id: 's2-divider-ordinal',
    type: 'divider',
    order: 7,
    style: 'scene-break',
    label: 'Ordinal: Order hai, lekin gap ka bharosa nahi',
  },
  {
    id: 's2-flashback-report-card',
    type: 'flashback',
    order: 8,
    title: 'Class 9 Report Card Day',
    dateBadge: 'Class 9',
    bodyMarkdown:
      'Shyam ki Maa (neeche se awaaz): "Shyam, Salim ko bata diya Class 9 mein tera Maths mein kya grade aaya tha?" Salim: "Aunty, mujhe yaad hai. Iska C tha aur mera B." Shyam: "Aur uske baad tu poore mohalle mein bolta phir raha tha ki \'main Shyam se ek grade upar hoon\'." Salim: "Aur wo sach tha!" Shyam: "Lekin kitna upar? Tera 61 tha aur mera 59."',
    entryAnimation: 'page-turn',
  },
  {
    id: 's2-dialogue-ordinal',
    type: 'dialogue',
    order: 9,
    lines: [
      {
        id: 'e2d23',
        speaker: 'salim',
        text: 'Ye flashback hi ordinal ka perfect example hai.',
        conceptRef: 'ordinal-attribute',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'e2d24', speaker: 'shyam', text: 'Kaise?', emphasis: 'none', displayOrder: 1 },
      {
        id: 'e2d25',
        speaker: 'salim',
        text: 'Grades mein order hai, A > B > C. Lekin A aur B ke beech ka gap B aur C ke gap ke barabar hai, ye guarantee nahi.',
        emphasis: 'none',
        displayOrder: 2,
      },
      {
        id: 'e2d26',
        speaker: 'shyam',
        text: 'Matlab mere C aur tere B mein 2 marks ka fark tha, lekin kisi aur ke B aur A mein 15 marks ka fark ho sakta hai.',
        emphasis: 'none',
        displayOrder: 3,
      },
      {
        id: 'e2d27',
        speaker: 'salim',
        text: 'Exactly. Shirt size bhi aisa hi hai. S < M < L, lekin "M minus S" kitna hai, ye bolna meaningless hai.',
        emphasis: 'none',
        displayOrder: 4,
      },
      {
        id: 'e2d28',
        speaker: 'shyam',
        text: 'To ordinal ke saath kya kar sakte hain?',
        emphasis: 'none',
        displayOrder: 5,
      },
      {
        id: 'e2d29',
        speaker: 'salim',
        text: 'Compare kar sakte hain (<, >), aur median nikal sakte hain. Lekin add ya subtract karke koi matlab nahi niklega.',
        emphasis: 'none',
        displayOrder: 6,
      },
    ],
  },
  {
    id: 's2-concept-ordinal',
    type: 'concept',
    order: 10,
    conceptName: 'Ordinal Attribute',
    anchorId: 'ordinal-attribute',
    simpleDefinition: 'Label hai aur order bhi — lekin do values ke beech ka gap barabar hone ki guarantee nahi.',
    technicalDefinition:
      'A categorical attribute whose values have a meaningful order, but the difference between consecutive values is not necessarily consistent. Comparison (<, >) and median are meaningful; arithmetic is not.',
    realWorldExample: 'Grades (A, B, C), shirt size (S, M, L), star ratings — order hai, lekin gap fixed nahi.',
    relatedTerms: ['order', 'rank', 'median'],
    bookmarkable: true,
  },
  {
    id: 's2-divider-interval',
    type: 'divider',
    order: 11,
    style: 'scene-break',
    label: 'Interval: Difference samajh aata hai, zero dhokha hai',
  },
  {
    id: 's2-dialogue-interval',
    type: 'dialogue',
    order: 12,
    lines: [
      {
        id: 'e2d30',
        speaker: 'salim',
        text: 'Ab tricky wala. Aaj Bengaluru mein temperature kitna hai?',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'e2d31', speaker: 'shyam', text: '28°C hoga.', emphasis: 'none', displayOrder: 1 },
      {
        id: 'e2d32',
        speaker: 'salim',
        text: 'Aur Lucknow mein winter mein 14°C. To Bengaluru double garam hai na?',
        emphasis: 'none',
        displayOrder: 2,
      },
      { id: 'e2d33', speaker: 'shyam', text: 'Haan, 28 to 14 ka double hai.', emphasis: 'none', displayOrder: 3 },
      {
        id: 'e2d34',
        speaker: 'salim',
        text: 'Galat, Shyam babu.',
        reaction: 'smirk',
        emphasis: 'none',
        displayOrder: 4,
      },
      { id: 'e2d35', speaker: 'shyam', text: 'Kyun?', emphasis: 'none', displayOrder: 5 },
      {
        id: 'e2d36',
        speaker: 'salim',
        text: 'Kyunki 0°C ka matlab "temperature hi nahi hai" nahi hota. 0°C sirf paani ke jamne ka point hai. Zero bas scale ka ek point hai, wahan quantity khatam nahi hoti.',
        conceptRef: 'interval-attribute',
        emphasis: 'bold',
        displayOrder: 6,
      },
      {
        id: 'e2d37',
        speaker: 'shyam',
        text: 'To 28°C aur 14°C mein kya bol sakte hain?',
        emphasis: 'none',
        displayOrder: 7,
      },
      {
        id: 'e2d38',
        speaker: 'salim',
        text: 'Ye bol sakte hain ki dono mein 14 degree ka difference hai. Ye meaningful hai. Lekin "double garam" bolna meaningful nahi hai.',
        emphasis: 'none',
        displayOrder: 8,
      },
    ],
  },
  {
    id: 's2-table-interval-rules',
    type: 'table',
    order: 13,
    caption: "Salim's Blackboard: Interval attributes",
    columns: ['Rule', 'Example'],
    rows: [
      ['Difference meaningful hai', '30°C − 20°C = 10°C ka fark'],
      ['Ratio meaningful nahi hai', '30°C, 15°C ka "double" nahi hai'],
    ],
    note: 'Kyun? Kyunki koi TRUE ZERO nahi hai. Rule: add aur subtract allowed hai, multiply aur divide ka matlab nahi banta.',
  },
  {
    id: 's2-concept-interval',
    type: 'concept',
    order: 14,
    conceptName: 'Interval Attribute',
    anchorId: 'interval-attribute',
    simpleDefinition: 'Number hai, difference meaningful hai, lekin zero ka matlab "kuch nahi" nahi hota.',
    technicalDefinition:
      'A numeric attribute where differences between values are meaningful, but there is no true zero point, so ratios are not meaningful. Addition and subtraction are valid; multiplication and division are not.',
    realWorldExample:
      'Temperature in °C, time of day, IQ score — 120 aur 100 mein 20 points ka fark hai, lekin IQ 0 ka matlab "zero intelligence" nahi hota.',
    relatedTerms: ['true zero', 'scale', 'difference'],
    bookmarkable: true,
  },
  {
    id: 's2-banter-iq-joke',
    type: 'banter',
    order: 15,
    speaker: 'shyam',
    text: 'IQ 0 ka matlab zero intelligence nahi hota? Thank God. Mujhe laga tera score ab tak isi wajah se kisi ko nahi dikhaya gaya.',
    reactionEmoji: '😏',
  },
  {
    id: 's2-divider-ratio',
    type: 'divider',
    order: 16,
    style: 'scene-break',
    label: 'Ratio: Asli zero, poori izzat',
  },
  {
    id: 's2-dialogue-ratio',
    type: 'dialogue',
    order: 17,
    lines: [
      {
        id: 'e2d39',
        speaker: 'salim',
        text: 'Ab ratio. Yahan true zero hota hai, yaani zero ka matlab sach mein "kuch nahi".',
        conceptRef: 'ratio-attribute',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'e2d40', speaker: 'shyam', text: 'Jaise?', emphasis: 'none', displayOrder: 1 },
      {
        id: 'e2d41',
        speaker: 'salim',
        text: 'Salary. ₹0 salary matlab koi income nahi. Aur ₹1,00,000 sach mein ₹50,000 ka double hai.',
        emphasis: 'none',
        displayOrder: 2,
      },
      {
        id: 'e2d42',
        speaker: 'shyam',
        text: 'Height bhi? 180 cm, 90 cm ka double hota hai?',
        emphasis: 'none',
        displayOrder: 3,
      },
      {
        id: 'e2d43',
        speaker: 'salim',
        text: 'Bilkul. Age, weight, height, exam marks, sab ratio hain. Inpe add, subtract, multiply, divide, sab meaningful hai.',
        emphasis: 'none',
        displayOrder: 4,
      },
      {
        id: 'e2d44',
        speaker: 'shyam',
        text: 'Achha, ek doubt. Temperature hamesha interval hi hota hai?',
        emphasis: 'none',
        displayOrder: 5,
      },
      {
        id: 'e2d45',
        speaker: 'salim',
        text: 'Nahi. Kelvin scale mein 0 K ka matlab hai thermal energy hi nahi hai. Wahan true zero hai, isliye Kelvin temperature ratio hai.',
        emphasis: 'none',
        displayOrder: 6,
      },
      {
        id: 'e2d46',
        speaker: 'shyam',
        text: 'Matlab type quantity se nahi, measuring scale se decide hota hai.',
        emphasis: 'bold',
        displayOrder: 7,
      },
      {
        id: 'e2d47',
        speaker: 'salim',
        text: 'Oye! Aaj tu bhi smart ho gaya.',
        emphasis: 'none',
        displayOrder: 8,
      },
      {
        id: 'e2d48',
        speaker: 'shyam',
        text: 'Kya karein, teacher hi itna average hai ki student ko mehnat karni padti hai.',
        emphasis: 'none',
        displayOrder: 9,
      },
    ],
  },
  {
    id: 's2-concept-ratio',
    type: 'concept',
    order: 18,
    conceptName: 'Ratio Attribute',
    anchorId: 'ratio-attribute',
    simpleDefinition: 'Number hai aur true zero bhi — zero ka matlab sach mein "kuch nahi" hota.',
    technicalDefinition:
      'A numeric attribute with a true, meaningful zero point, making all arithmetic operations — including ratios — meaningful. The attribute type depends on the measuring scale, not just the quantity (e.g. Celsius is interval, Kelvin is ratio).',
    realWorldExample: 'Salary, age, height, weight, Kelvin temperature — ₹1,00,000 sach mein ₹50,000 ka double hai.',
    relatedTerms: ['true zero', 'ratio scale', 'arithmetic'],
    bookmarkable: true,
  },
  {
    id: 's2-table-operations-matrix',
    type: 'table',
    order: 19,
    caption: 'Kaunsa operation kahan allowed hai?',
    columns: ['Operation', 'Nominal', 'Ordinal', 'Interval', 'Ratio'],
    rows: [
      ['Same / different (=, ≠)', '✅', '✅', '✅', '✅'],
      ['Order (<, >)', '❌', '✅', '✅', '✅'],
      ['Difference (+, −)', '❌', '❌', '✅', '✅'],
      ['Ratio (×, ÷)', '❌', '❌', '❌', '✅'],
      ['Typical summary', 'Mode', 'Median', 'Mean', 'Mean'],
    ],
  },
  {
    id: 's2-examtip-noir',
    type: 'examTip',
    order: 20,
    tip: 'Yaad rakhne ki trick: N-O-I-R — Nominal → Ordinal → Interval → Ratio. Har level pe ek naya power unlock hota hai.',
    importance: 'high',
  },
  {
    id: 's2-confusion-pincode',
    type: 'confusion',
    order: 21,
    misconception: 'PIN code number jaisa dikhta hai (560001), to wo ratio attribute hoga.',
    clarification:
      'Ye exam ka sabse common trap hai. 560001 + 226001 karke koi naya area nahi milta — kyunki PIN code number jaisa dikhta hai, lekin actually label hai, isliye wo nominal hai. Mobile number aur roll number bhi aise hi hain. Number dikhna ≠ numerical attribute hona — check karo ki us number pe maths karne se koi matlab nikalta hai ya nahi.',
    relatedConceptRef: 'nominal-attribute',
  },
  {
    id: 's2-divider-ml-relevance',
    type: 'divider',
    order: 22,
    style: 'scene-break',
    label: 'ML Mein Ye Kyun Matter Karta Hai?',
  },
  {
    id: 's2-dialogue-ml-relevance',
    type: 'dialogue',
    order: 23,
    lines: [
      {
        id: 'e2d49',
        speaker: 'shyam',
        text: 'Theek hai, samajh gaya. Lekin ML mein iska kya kaam?',
        emphasis: 'none',
        displayOrder: 0,
      },
      {
        id: 'e2d50',
        speaker: 'salim',
        text: 'Bahut bada kaam. Maan le tune cities ko aise likha: Delhi = 1, Mumbai = 2, Bengaluru = 3.',
        emphasis: 'none',
        displayOrder: 1,
      },
      {
        id: 'e2d51',
        speaker: 'shyam',
        text: 'Model ko number chahiye, to sahi hai na?',
        emphasis: 'none',
        displayOrder: 2,
      },
      {
        id: 'e2d52',
        speaker: 'salim',
        text: 'Model sochega Bengaluru > Mumbai > Delhi. Ya phir Delhi + Mumbai = Bengaluru.',
        emphasis: 'none',
        displayOrder: 3,
      },
      {
        id: 'e2d53',
        speaker: 'shyam',
        text: 'Ye to Bengaluru wale bhi nahi maanenge.',
        emphasis: 'none',
        displayOrder: 4,
      },
      {
        id: 'e2d54',
        speaker: 'salim',
        text: 'Isliye nominal data ko usually one-hot encoding se represent karte hain, jahan har city ka alag column hota hai. Ordinal data mein order matter karta hai, to wahan S = 1, M = 2, L = 3 jaisi ordinal encoding chal sakti hai.',
        emphasis: 'none',
        displayOrder: 5,
      },
      {
        id: 'e2d55',
        speaker: 'shyam',
        text: 'Matlab attribute ka type galat samjha, to model galat pattern seekhega.',
        emphasis: 'none',
        displayOrder: 6,
      },
      {
        id: 'e2d56',
        speaker: 'salim',
        text: 'Pichhle hafte tune hi bola tha. Garbage in...',
        emphasis: 'none',
        displayOrder: 7,
      },
      {
        id: 'e2d57',
        speaker: 'shyam',
        text: '...garbage out. Haan haan, apni hi line mujhe mat suna.',
        emphasis: 'none',
        displayOrder: 8,
      },
    ],
  },
  {
    id: 's2-divider-discrete-continuous',
    type: 'divider',
    order: 24,
    style: 'scene-break',
    label: ' Bonus: Discrete vs Continuous',
  },
  {
    id: 's2-dialogue-discrete-continuous',
    type: 'dialogue',
    order: 25,
    lines: [
      {
        id: 'e2d58',
        speaker: 'salim',
        text: 'Last cheez. Ek aur tareeke se bhi attributes baante jaate hain.',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'e2d59', speaker: 'shyam', text: 'Kaise?', emphasis: 'none', displayOrder: 1 },
      {
        id: 'e2d60',
        speaker: 'salim',
        text: 'Tere chacha ke kitne bachche hain?',
        emphasis: 'none',
        displayOrder: 2,
      },
      { id: 'e2d61', speaker: 'shyam', text: 'Teen.', emphasis: 'none', displayOrder: 3 },
      { id: 'e2d62', speaker: 'salim', text: '2.7 ho sakte hain?', emphasis: 'none', displayOrder: 4 },
      { id: 'e2d63', speaker: 'shyam', text: 'Chacha se mat poochna.', emphasis: 'none', displayOrder: 5 },
      {
        id: 'e2d64',
        speaker: 'salim',
        text: 'Ye discrete attribute hai, jo countable values leta hai. Ab tera weight bata.',
        emphasis: 'none',
        displayOrder: 6,
      },
      { id: 'e2d65', speaker: 'shyam', text: '72 kg.', emphasis: 'none', displayOrder: 7 },
      {
        id: 'e2d66',
        speaker: 'salim',
        text: 'Exactly 72? Ya 72.4? Ya 72.43?',
        emphasis: 'none',
        displayOrder: 8,
      },
      {
        id: 'e2d67',
        speaker: 'shyam',
        text: 'Paratha ke baad 73 maan le.',
        emphasis: 'none',
        displayOrder: 9,
      },
      {
        id: 'e2d68',
        speaker: 'salim',
        text: 'Weight, height, time, ye continuous hain. Theoretically do values ke beech infinite values ho sakti hain.',
        emphasis: 'none',
        displayOrder: 10,
      },
    ],
  },
  {
    id: 's2-table-discrete-continuous',
    type: 'table',
    order: 26,
    caption: 'Discrete vs Continuous',
    columns: ['Discrete', 'Continuous'],
    rows: [
      ['Countable values', 'Kisi range mein koi bhi value'],
      ['Number of children, number of cars, PIN code', 'Height, weight, age, time'],
      ['Usually integers', 'Decimal values possible'],
    ],
    note:
      'Interesting case: exam marks agar sirf integers mein store hote hain (70, 71, 72), to discrete hain. Agar 70.5, 80.25 jaise store hote hain, to continuous treat ho sakte hain.',
  },
  {
    id: 's2-example-credit-card',
    type: 'example',
    order: 27,
    title: 'Case Study: Bank Ka Titanium Credit Card Campaign',
    scenario:
      'Bank customers ko segment karke premium card offer karna chahta hai. Har attribute ko uske type ke hisaab se identify karna hai.',
    walkthroughMarkdown:
      'Age aur Income ratio hain kyunki inka true zero hai aur double/half meaningful hai. Card type (Silver, Gold, Titanium) aur Loyalty score ordinal hain — order hai, lekin gap fixed nahi. City nominal hai — sirf label. Credit score (300–900) ko commonly interval treat karte hain — differences compare kar sakte hain, lekin 0 score ka koi real meaning nahi hai.',
    outcome:
      'Attribute ka type sahi pehchanna hi decide karta hai ki use model mein kaise encode aur process kiya jaaye.',
  },
  {
    id: 's2-table-credit-card-attributes',
    type: 'table',
    order: 28,
    caption: 'Attribute breakdown',
    columns: ['Attribute', 'Type', 'Reason'],
    rows: [
      ['Age', 'Ratio, continuous', '0 ka meaning hai, double/half meaningful'],
      ['Income', 'Ratio', '₹0 = koi income nahi'],
      ['Card type (Silver, Gold, Titanium)', 'Ordinal', 'Order hai, gap fixed nahi'],
      ['Loyalty score (1–10)', 'Ordinal', 'Ranking hai, gap equal hone ki guarantee nahi'],
      ['City', 'Nominal', 'Sirf label'],
      ['Credit score (300–900)', 'Interval (commonly treated)', 'Differences compare kar sakte hain, lekin 0 score ka koi meaning nahi'],
    ],
  },
  {
    id: 's2-summary-recap',
    type: 'summary',
    order: 29,
    title: 'Aaj Salim Ne Shyam Ko Kya Sikhaya?',
    points: [
      'Nominal: sirf label. Blood group, city, colour.',
      'Ordinal: label + order. Grades, shirt size, ratings.',
      'Interval: numbers + meaningful difference, lekin true zero nahi. °C, time of day, IQ.',
      'Ratio: numbers + true zero. Salary, height, age, weight, Kelvin.',
      'Discrete: countable values. Continuous: range mein koi bhi value.',
      'Number jaisa dikhne wala har attribute numeric nahi hota — PIN code nominal hai.',
      'Attribute ka type decide karta hai ki use model mein kaise encode aur process karna hai.',
    ],
  },
  {
    id: 's2-quiz-episode-2',
    type: 'quiz',
    order: 30,
    title: 'Chai Break Quiz ☕',
    questions: [
      {
        id: 'e2q1',
        questionType: 'multiple-choice',
        prompt: 'Restaurant ki star rating (1 se 5 stars) kis type ka attribute hai?',
        options: [
          { id: 'a', text: 'Nominal' },
          { id: 'b', text: 'Ordinal' },
          { id: 'c', text: 'Ratio' },
          { id: 'd', text: 'Interval' },
        ],
        correctOptionId: 'b',
        explanation:
          'Ordinal. Order hai, lekin 4 aur 5 star ka gap 1 aur 2 star ke gap jaisa hone ki guarantee nahi.',
      },
      {
        id: 'e2q2',
        questionType: 'true-false',
        prompt: '"Aaj 20°C hai, kal 40°C tha, to kal double garmi thi." Ye statement sahi hai?',
        correctAnswer: false,
        explanation: 'Nahi. Celsius interval scale hai. Koi true zero nahi hai, isliye ratio meaningful nahi.',
      },
      {
        id: 'e2q3',
        questionType: 'short-answer',
        prompt: 'Aadhaar number kaunsa attribute type hai?',
        acceptableAnswers: ['nominal'],
        explanation: 'Nominal. Ye identifier hai. Do Aadhaar numbers add karne ka koi matlab nahi.',
      },
      {
        id: 'e2q4',
        questionType: 'short-answer',
        prompt: 'Number of website visits per day: discrete ya continuous?',
        acceptableAnswers: ['discrete'],
        explanation: 'Discrete. 3.6 visits nahi ho sakti.',
      },
    ],
  },
  {
    id: 's2-homework-episode-2',
    type: 'homework',
    order: 31,
    dueLabel: 'Next Sunday tak — comments mein likho',
    difficulty: 'medium',
    tasks: [
      'Apne Swiggy/Zomato order history socho aur ye attributes classify karo: restaurant name, order amount, delivery rating (1–5), order time, number of items, delivery distance.',
    ],
  },
  {
    id: 's2-dialogue-teaser-banter',
    type: 'dialogue',
    order: 32,
    lines: [
      { id: 'e2d69', speaker: 'shyam', text: 'Agli baar class meri.', emphasis: 'none', displayOrder: 0 },
      { id: 'e2d70', speaker: 'salim', text: 'Kya padhayega?', emphasis: 'none', displayOrder: 1 },
      {
        id: 'e2d71',
        speaker: 'shyam',
        text: 'Tera Class 9 ka Maths marks wala data dekha maine. Kahin 59 likha, kahin "fifty-nine", aur ek jagah blank tha.',
        emphasis: 'none',
        displayOrder: 2,
      },
      { id: 'e2d72', speaker: 'salim', text: 'To?', emphasis: 'none', displayOrder: 3 },
      {
        id: 'e2d73',
        speaker: 'shyam',
        text: 'To agle Sunday Data Quality Issues padhenge: missing values, duplicates, noise, inconsistent data aur outliers.',
        emphasis: 'none',
        displayOrder: 4,
      },
      {
        id: 'e2d74',
        speaker: 'salim',
        text: 'Matlab mere marks ka postmortem?',
        emphasis: 'none',
        displayOrder: 5,
      },
      {
        id: 'e2d75',
        speaker: 'shyam',
        text: 'Postmortem nahi. Data cleaning.',
        reaction: 'smug',
        emphasis: 'none',
        displayOrder: 6,
      },
    ],
  },
  {
    id: 's2-teaser-next-episode',
    type: 'teaser',
    order: 33,
    nextEpisodeTitle: 'Data Mein Kachra Kahan Se Aata Hai?',
    teaserText:
      'Agle Sunday: Shyam, Salim ke Class 9 marks ka "postmortem" karte hue missing values, duplicates, noise, inconsistent data aur outliers samjhayega.',
  },
];

/**
 * Episode 3 — "Data Mein Kachra Kahan Se Aata Hai?". Shyam teaches again,
 * using a mohalla cricket club's old score register to walk Salim through
 * the five common data-quality issues. This episode also ships a full
 * multi-voice audio-drama script (see `episode3Audio` below) alongside the
 * text reader.
 */
const episode3ContentBlocks: ContentBlock[] = [
  {
    id: 's3-scene-drawing-room',
    type: 'scene',
    order: 0,
    sceneTitle: "Salim Ka Drawing Room",
    location: "Salim's drawing room",
    time: 'Sunday, 5:30 PM',
    sessionLabel: 'Module 2 · Episode 3',
    backgroundTheme: 'neutral',
    ambientDescription:
      'Baahar halki baarish ho rahi hai. Salim ki Ammi ne chai ke saath samose bheje hain. Shyam ke haath mein ek purana register hai — mohalla cricket club ka score register, jo usne Salim ki almari se nikala hai.',
    transitionStyle: 'fade',
  },
  {
    id: 's3-dialogue-register-discovery',
    type: 'dialogue',
    order: 1,
    lines: [
      { id: 'e3d1', speaker: 'salim', text: 'Ye register kahan se mila tujhe?', emphasis: 'none', displayOrder: 0 },
      {
        id: 'e3d2',
        speaker: 'shyam',
        text: 'Teri almari mein. Teri purani diary ke neeche.',
        emphasis: 'none',
        displayOrder: 1,
      },
      { id: 'e3d3', speaker: 'salim', text: 'Tune meri diary padhi?', emphasis: 'none', displayOrder: 2 },
      {
        id: 'e3d4',
        speaker: 'shyam',
        text: 'Nahi. Bas pehla page dekha. "Meri zindagi ka maqsad: Sachin banna." Bas wahi.',
        emphasis: 'none',
        displayOrder: 3,
      },
      { id: 'e3d5', speaker: 'salim', text: 'Wo Class 6 mein likha tha!', emphasis: 'none', displayOrder: 4 },
      {
        id: 'e3d6',
        speaker: 'shyam',
        text: 'Aur ye register bata raha hai tu Class 6 mein bhi Sachin nahi tha. Chal, aaj ka data yahi hai.',
        emphasis: 'bold',
        displayOrder: 5,
      },
    ],
  },
  {
    id: 's3-dialogue-intro',
    type: 'dialogue',
    order: 2,
    lines: [
      {
        id: 'e3d7',
        speaker: 'shyam',
        text: 'Pichhle hafte tune mujhe attribute types padhaye. Aaj main poochta hoon: data ho, type bhi pata ho, phir bhi model galat seekh sakta hai?',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'e3d8', speaker: 'salim', text: 'Haan, agar data hi kharab ho.', emphasis: 'none', displayOrder: 1 },
      {
        id: 'e3d9',
        speaker: 'shyam',
        text: 'Bas. Aaj usi kachre ki baat karenge. Data quality issues. Paanch tarah ka kachra hota hai.',
        emphasis: 'bold',
        displayOrder: 2,
      },
    ],
  },
  {
    id: 's3-table-five-issues',
    type: 'table',
    order: 3,
    caption: 'Data quality ke 5 common issues',
    columns: ['Issue', 'Simple meaning', 'Example'],
    rows: [
      ['Missing values', 'Value hi nahi hai', 'Blank cell, age "?"'],
      ['Duplicate data', 'Same record baar-baar', 'Same customer 3 baar'],
      ['Inconsistent data', 'Same cheez alag-alag tarah likhi', 'y, Yes, YES, yes'],
      ['Noise', 'Galat ya impossible value', 'Age = -100, Age = "ABC"'],
      ['Outliers', 'Baaki se bahut alag value', 'Product prices ₹500 ke aas-paas, ek ₹10,00,000'],
    ],
  },
  {
    id: 's3-divider-missing',
    type: 'divider',
    order: 4,
    style: 'scene-break',
    label: '1️⃣ Missing Values: Khaali Dabba',
  },
  {
    id: 's3-dialogue-missing-register',
    type: 'dialogue',
    order: 5,
    lines: [
      {
        id: 'e3d10',
        speaker: 'shyam',
        text: '2011 ka final match. Teri batting ke aage kya likha hai?',
        stageDirection: 'register kholte hue',
        emphasis: 'none',
        displayOrder: 0,
      },
      {
        id: 'e3d11',
        speaker: 'salim',
        text: '...Kuch nahi. Khaali hai.',
        stageDirection: 'jhuk ke dekhta hai',
        emphasis: 'none',
        displayOrder: 1,
      },
      { id: 'e3d12', speaker: 'shyam', text: 'Kyun?', emphasis: 'none', displayOrder: 2 },
      { id: 'e3d13', speaker: 'salim', text: 'Shayad scorer bhool gaya.', emphasis: 'none', displayOrder: 3 },
      {
        id: 'e3d14',
        speaker: 'shyam',
        text: 'Ya shayad tu zero pe out hua aur tune khud page se mita diya.',
        emphasis: 'none',
        displayOrder: 4,
      },
      { id: 'e3d15', speaker: 'salim', text: 'Ye allegation hai!', emphasis: 'none', displayOrder: 5 },
      {
        id: 'e3d16',
        speaker: 'shyam',
        text: 'Ye missing value hai. Aur dekh, data missing kyun hota hai, ye samajhna zaroori hai.',
        conceptRef: 'missing-values',
        emphasis: 'none',
        displayOrder: 6,
      },
    ],
  },
  {
    id: 's3-concept-missing-values',
    type: 'concept',
    order: 6,
    conceptName: 'Missing Values',
    anchorId: 'missing-values',
    simpleDefinition: 'Dataset mein kisi attribute ki value hi absent hai — blank cell ya "?" jaisa.',
    technicalDefinition:
      'An attribute value that was not recorded for a given data object. Why a value is missing (not known, withheld, lost in entry, or a technical failure) determines how it should be handled.',
    realWorldExample:
      'Log jaante hi nahi (blood group), log batana nahi chahte (salary, age, weight), manual entry ki galti (form field skip), ya technical issue (web form submit hote waqt data lost ho gaya).',
    relatedTerms: ['missing data', 'blank', 'null'],
    bookmarkable: true,
  },
  {
    id: 's3-divider-duplicate',
    type: 'divider',
    order: 7,
    style: 'scene-break',
    label: '2️⃣ Duplicate Data: Ek Hi Banda, Teen Entries',
  },
  {
    id: 's3-dialogue-duplicate',
    type: 'dialogue',
    order: 8,
    lines: [
      {
        id: 'e3d17',
        speaker: 'shyam',
        text: 'Ab ye dekh. Season ke players ki list.',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'e3d18', speaker: 'salim', text: 'Salim Khan, Salim K., S. Khan... Teen Salim?', emphasis: 'none', displayOrder: 1 },
      { id: 'e3d19', speaker: 'shyam', text: 'Teeno tu hi hai.', emphasis: 'none', displayOrder: 2 },
      { id: 'e3d20', speaker: 'salim', text: 'To?', emphasis: 'none', displayOrder: 3 },
      {
        id: 'e3d21',
        speaker: 'shyam',
        text: 'To club ke records ke hisaab se teen alag Salim ne us season mein 12 run banaye. Matlab tere real average se data teen guna confused hai.',
        conceptRef: 'duplicate-data',
        emphasis: 'bold',
        displayOrder: 4,
      },
      { id: 'e3d22', speaker: 'salim', text: 'Tu insult kar raha hai ya padha raha hai?', emphasis: 'none', displayOrder: 5 },
      { id: 'e3d23', speaker: 'shyam', text: 'Dono. Multitasking.', emphasis: 'none', displayOrder: 6 },
    ],
  },
  {
    id: 's3-dialogue-duplicate-ml',
    type: 'dialogue',
    order: 9,
    lines: [
      {
        id: 'e3d24',
        speaker: 'shyam',
        text: 'ML mein duplicate ka problem samajh. Maan le ek e-commerce dataset mein ek hi customer 5 baar hai. Model sochega aise 5 customers hain, aur unka behaviour zarurat se zyada important ho jayega.',
        emphasis: 'none',
        displayOrder: 0,
      },
      {
        id: 'e3d25',
        speaker: 'salim',
        text: 'Matlab model kisi ek bande ko poori public samajh lega.',
        emphasis: 'none',
        displayOrder: 1,
      },
      {
        id: 'e3d26',
        speaker: 'shyam',
        text: 'Bilkul. Jaise tere ghar mein ek baar maine Ammi ke biryani ki tareef ki, aur ab tak har Eid pe teen plate bhejti hain.',
        emphasis: 'none',
        displayOrder: 2,
      },
      { id: 'e3d27', speaker: 'salim', text: 'Wo duplicate nahi, pyaar hai.', emphasis: 'none', displayOrder: 3 },
      { id: 'e3d28', speaker: 'shyam', text: 'Model ke liye dono same hain.', emphasis: 'none', displayOrder: 4 },
    ],
  },
  {
    id: 's3-concept-duplicate-data',
    type: 'concept',
    order: 10,
    conceptName: 'Duplicate Data',
    anchorId: 'duplicate-data',
    simpleDefinition: 'Same record dataset mein ek se zyada baar maujood hai.',
    technicalDefinition:
      'Multiple records in a dataset that represent the same real-world entity. Duplicates bias a model by over-weighting whatever that entity\'s behaviour happens to be.',
    realWorldExample:
      'Ek customer ka naam "Salim Khan", "Salim K." aur "S. Khan" se teen alag records ban jaaye — model unhe teen alag log samjhega.',
    relatedTerms: ['deduplication', 'bias', 'record linkage'],
    bookmarkable: true,
  },
  {
    id: 's3-divider-inconsistent',
    type: 'divider',
    order: 11,
    style: 'scene-break',
    label: '3️⃣ Inconsistent Data: Same Baat, Alag Andaaz',
  },
  {
    id: 's3-dialogue-inconsistent',
    type: 'dialogue',
    order: 12,
    lines: [
      { id: 'e3d29', speaker: 'shyam', text: '"Match jeeta?" column dekh.', emphasis: 'none', displayOrder: 0 },
      { id: 'e3d30', speaker: 'salim', text: 'y, Yes, YES, yes, Y, haan...', emphasis: 'none', displayOrder: 1 },
      { id: 'e3d31', speaker: 'shyam', text: 'Humein pata hai sab ka matlab ek hi hai. Computer ko?', emphasis: 'none', displayOrder: 2 },
      { id: 'e3d32', speaker: 'salim', text: 'Computer ko chhe alag answer dikhenge.', emphasis: 'none', displayOrder: 3 },
      {
        id: 'e3d33',
        speaker: 'shyam',
        text: 'Exactly. Aur dates bhi dekh: kahin "15-Aug-2011", kahin "2011-08-15", kahin "15/08/2011".',
        conceptRef: 'inconsistent-data',
        emphasis: 'none',
        displayOrder: 4,
      },
      {
        id: 'e3d34',
        speaker: 'salim',
        text: 'Ye to waisa hai jaise tu mera naam phone mein "Salim", "Salim Bhai" aur "Salim Udhaar" teen naam se save karta hai.',
        emphasis: 'none',
        displayOrder: 5,
      },
      {
        id: 'e3d35',
        speaker: 'shyam',
        text: '"Salim Udhaar" sabse accurate attribute hai. ₹500 abhi tak pending hain.',
        emphasis: 'none',
        displayOrder: 6,
      },
    ],
  },
  {
    id: 's3-concept-inconsistent-data',
    type: 'concept',
    order: 13,
    conceptName: 'Inconsistent Data',
    anchorId: 'inconsistent-data',
    simpleDefinition: 'Same cheez ko dataset mein alag-alag tarah likha gaya hai.',
    technicalDefinition:
      'Values representing the same underlying fact but recorded in different formats, spellings, cases or units — e.g. "yes"/"YES"/"Y", three different date formats, or kg vs pounds. Fix by standardizing to one format per column.',
    realWorldExample:
      'Same cheez ke alag naam bhi isi mein aata hai — jaise "AI" aur "Artificial Intelligence" alag category ban jaana.',
    relatedTerms: ['standardization', 'normalization', 'data cleaning'],
    bookmarkable: true,
  },
  {
    id: 's3-divider-noise',
    type: 'divider',
    order: 14,
    style: 'scene-break',
    label: '4️⃣ Noise: Jo Ho Hi Nahi Sakta',
  },
  {
    id: 's3-dialogue-noise',
    type: 'dialogue',
    order: 15,
    lines: [
      { id: 'e3d36', speaker: 'shyam', text: 'Ab age column dekh.', emphasis: 'none', displayOrder: 0 },
      { id: 'e3d37', speaker: 'salim', text: '14, 15, 13, -100, 350, "ABC"...', emphasis: 'none', displayOrder: 1 },
      { id: 'e3d38', speaker: 'shyam', text: 'Bata, kaunse values galat hain?', emphasis: 'none', displayOrder: 2 },
      {
        id: 'e3d39',
        speaker: 'salim',
        text: '-100 saal ka koi nahi hota. 350 saal ka bowler bhi nahi tha. Aur "ABC" age kaise ho sakti hai?',
        emphasis: 'none',
        displayOrder: 3,
      },
      {
        id: 'e3d40',
        speaker: 'shyam',
        text: 'Wo Pappu ne bhara tha. Usse laga form mein naam ki initials maangi hain.',
        emphasis: 'none',
        displayOrder: 4,
      },
      { id: 'e3d41', speaker: 'salim', text: 'Pappu ab kya karta hai?', emphasis: 'none', displayOrder: 5 },
      { id: 'e3d42', speaker: 'shyam', text: 'Data entry operator hai.', emphasis: 'none', displayOrder: 6 },
      {
        id: 'e3d43',
        speaker: 'salim',
        text: 'Isliye duniya ka data kharab hai!',
        stageDirection: 'chai thookne se bachte hue',
        emphasis: 'none',
        displayOrder: 7,
      },
    ],
  },
  {
    id: 's3-concept-noise',
    type: 'concept',
    order: 16,
    conceptName: 'Noise',
    anchorId: 'noise',
    simpleDefinition: 'Data mein random errors ya galat values jo reality ko represent nahi karti.',
    technicalDefinition:
      'Random errors or invalid values introduced by measurement, sensor or entry mistakes — not genuine signal. Usually a candidate for fixing or removing, since it doesn\'t reflect any real underlying case.',
    realWorldExample:
      'Age = -100 ya 350, numeric column mein text ("ABC"), ya faulty sensor reading: 30°C, 30.2°C, 75°C, 29.9°C.',
    relatedTerms: ['measurement error', 'invalid value', 'data cleaning'],
    bookmarkable: true,
  },
  {
    id: 's3-divider-outliers',
    type: 'divider',
    order: 17,
    style: 'scene-break',
    label: '5️⃣ Outliers: Alag Hai, Par Galat Ho Ye Zaroori Nahi',
  },
  {
    id: 's3-dialogue-outlier-raju',
    type: 'dialogue',
    order: 18,
    lines: [
      { id: 'e3d44', speaker: 'salim', text: 'Ab ye dekh! 2012 ka match. Raju: 147 runs.', emphasis: 'none', displayOrder: 0 },
      { id: 'e3d45', speaker: 'shyam', text: 'Baaki sab ke runs?', emphasis: 'none', displayOrder: 1 },
      { id: 'e3d46', speaker: 'salim', text: '10, 15, 8, 22, 12...', emphasis: 'none', displayOrder: 2 },
      { id: 'e3d47', speaker: 'shyam', text: 'To 147 kya hai?', emphasis: 'none', displayOrder: 3 },
      { id: 'e3d48', speaker: 'salim', text: 'Noise! Gully cricket mein 147 kaun banata hai?', emphasis: 'none', displayOrder: 4 },
      {
        id: 'e3d49',
        speaker: 'shyam',
        text: 'Raju ne banaya tha. Main wahan tha. Tu bhi wahan tha. Bas tu fielding karte waqt naali mein gend dhoondh raha tha.',
        emphasis: 'none',
        displayOrder: 5,
      },
      { id: 'e3d50', speaker: 'salim', text: '...Haan, yaad aaya.', emphasis: 'none', displayOrder: 6 },
      {
        id: 'e3d51',
        speaker: 'shyam',
        text: 'Yahi farak hai. 147 baaki values se bahut alag hai, isliye outlier hai. Lekin galat nahi hai. Real hai.',
        conceptRef: 'outlier',
        emphasis: 'bold',
        displayOrder: 7,
      },
    ],
  },
  {
    id: 's3-confusion-noise-vs-outlier',
    type: 'confusion',
    order: 19,
    misconception: 'Agar ek value baaki sab se bahut alag hai, to wo galat hai ya noise hai.',
    clarification:
      'Noise wo hai jo ho hi nahi sakta, ya galti se aayi hai — jaise Age = -100. Outlier wo hai jo possible hai, bas baaki sab se bahut alag hai — jaise Raju ke 147 runs, ya company mein CEO ki salary. Outlier mile to seedha delete mat karo: pehle check karo ki ye typing ki galti hai, ya real but rare case hai, ya domain mein aisi value possible hai. Fraud detection jaise cases mein to outlier hi dhoondhna hota hai.',
    relatedConceptRef: 'outlier',
  },
  {
    id: 's3-concept-outlier',
    type: 'concept',
    order: 20,
    conceptName: 'Outlier',
    anchorId: 'outlier',
    simpleDefinition: 'Ek value jo baaki dataset se bahut alag hai — lekin galat hona zaroori nahi.',
    technicalDefinition:
      'A data point that differs significantly from other observations. Unlike noise, an outlier can be a genuine, valid case — deciding whether to fix, remove, or keep it requires checking whether it is a data-entry error, a real rare event, or expected in the domain.',
    realWorldExample:
      'Gully cricket mein zyada­tar scores 10-20 ke beech hain, lekin Raju ne ek din 147 banaye — real hai, sirf rare hai.',
    relatedTerms: ['anomaly', 'fraud detection', 'rare event'],
    bookmarkable: true,
  },
  {
    id: 's3-examtip-outlier-checklist',
    type: 'examTip',
    order: 21,
    tip: 'Outlier mila to delete mat karo turant. Pehle poocho: (1) kya ye typing ki galti hai, jaise ₹1,000 ki jagah ₹10,00,000 type ho gaya? (2) kya ye real but rare case hai? (3) domain mein aisi value possible hai? Galti ho to fix karo, real ho to sochke decide karo.',
    importance: 'high',
  },
  {
    id: 's3-table-university-dataset',
    type: 'table',
    order: 22,
    caption: 'Exam-style question: Ek university ka student dataset',
    columns: ['Name', 'Age', 'Email', 'Specialization', 'Admission Date', 'CGPA'],
    rows: [
      ['Rina', '22', 'rina@example.com', 'AI', '15-Aug-2022', '8.2'],
      ['Dev', '23', 'dev [at] mail.com', 'Cybersecurity', '2022-08-15', '7.8'],
      ['Aarav', '22', 'aarav@example.com', 'Data Science', '15/08/2022', '9.1'],
      ['Shweta', '22', '(blank)', 'Cybersecurity', '15-Aug-2022', '6.4'],
      ['Rina', '22', 'rina@example.com', 'Artificial Intelligence', '15-Aug-2022', '8.2'],
      ['Mansi', '58', 'mansi123@gmail.com', 'Data Science', '15-Aug-2022', '7.0'],
    ],
    note: 'Issues kya hain? Socho before reading the answer below.',
  },
  {
    id: 's3-example-university-issues',
    type: 'example',
    order: 23,
    title: 'University Dataset — Issues Identified',
    scenario: 'Upar wale dataset mein chhe tarah ke issues chhupe hain — har ek ko uske type se match karo.',
    walkthroughMarkdown:
      'Duplicate: Rina do baar hai (same email, same CGPA). Inconsistent category: "AI" vs "Artificial Intelligence" — same cheez, alag naam. Inconsistent date format: teen alag formats ek hi column mein. Invalid format: "dev [at] mail.com" valid email nahi hai. Missing value: Shweta ka email blank hai. Possible outlier: Mansi ki age 58 — M.Tech mein unusual hai, lekin possible hai.',
    outcome: 'Verify karo, delete nahi — outlier ho sakta hai ki Mansi genuinely ek mature student ho.',
  },
  {
    id: 's3-summary-recap',
    type: 'summary',
    order: 24,
    title: 'Aaj Shyam Ne Salim Ko Kya Sikhaya?',
    points: [
      'Missing values: value absent hai — log jaante nahi, batana nahi chahte, entry miss hui ya data lost hua.',
      'Duplicates: same record kai baar — model ka nazariya bias karte hain.',
      'Inconsistent data: same cheez alag format mein — standardize karna padta hai.',
      'Noise: galat ya impossible values, usually entry/measurement ki galti.',
      'Outliers: bahut alag values — zaroori nahi ki galat hon.',
      'Data clean kiye bina model train karna = garbage in, garbage out.',
    ],
  },
  {
    id: 's3-quiz-episode-3',
    type: 'quiz',
    order: 25,
    title: 'Chai Break Quiz ☕',
    questions: [
      {
        id: 'e3q1',
        questionType: 'short-answer',
        prompt: 'Ek temperature sensor ki readings: 31, 30.5, 31.2, 999, 30.8. "999" kya hai?',
        acceptableAnswers: ['noise', 'sensor error', 'faulty reading'],
        explanation:
          'Zyada chance hai ye noise hai — sensor ka error code ya faulty reading, kyunki normal room temperature 999°C nahi hota.',
      },
      {
        id: 'e3q2',
        questionType: 'true-false',
        prompt: 'Ek bank mein ek customer ka transaction ₹50 lakh ka hai, jabki average ₹5,000 hai. Kya ise delete kar dena chahiye?',
        correctAnswer: false,
        explanation:
          'Nahi. Ye outlier hai, galat ho ye zaroori nahi. Ye genuine bada transaction ya fraud bhi ho sakta hai — verify karna chahiye, delete nahi.',
      },
      {
        id: 'e3q3',
        questionType: 'multiple-choice',
        prompt: '"Male", "M", "male", "MALE" — ek column mein ye values hain. Ye kaunsa issue hai?',
        options: [
          { id: 'a', text: 'Missing values' },
          { id: 'b', text: 'Duplicate data' },
          { id: 'c', text: 'Inconsistent data' },
          { id: 'd', text: 'Outlier' },
        ],
        correctOptionId: 'c',
        explanation: 'Inconsistent data — same cheez (male), alag spelling aur case mein likhi gayi hai.',
      },
    ],
  },
  {
    id: 's3-homework-episode-3',
    type: 'homework',
    order: 26,
    dueLabel: 'Comments mein batao',
    difficulty: 'easy',
    tasks: [
      'Apne phone ki contact list kholo aur dhoondo: ek duplicate contact.',
      'Ek inconsistent naam dhoondo (jaise "Mummy", "Mom", "Maa").',
      'Ek missing value dhoondo (number hai, naam nahi).',
    ],
  },
  {
    id: 's3-dialogue-teaser-banter',
    type: 'dialogue',
    order: 27,
    lines: [
      {
        id: 'e3d52',
        speaker: 'salim',
        text: 'Agli baar meri class. Aur main batāunga ki is kachre ko saaf kaise karte hain.',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'e3d53', speaker: 'shyam', text: 'Matlab?', emphasis: 'none', displayOrder: 1 },
      {
        id: 'e3d54',
        speaker: 'salim',
        text: 'Missing values ko kaise bhara jaata hai, aur outlier kaise pakda jaata hai, IQR aur 3-sigma rule se.',
        emphasis: 'none',
        displayOrder: 2,
      },
      { id: 'e3d55', speaker: 'shyam', text: 'Aur Raju ke 147 runs?', emphasis: 'none', displayOrder: 3 },
      { id: 'e3d56', speaker: 'salim', text: 'Unka bhi postmortem hoga. Maths se.', emphasis: 'none', displayOrder: 4 },
    ],
  },
  {
    id: 's3-teaser-next-episode',
    type: 'teaser',
    order: 28,
    nextEpisodeTitle: 'Kachra Saaf Karo: Missing Values Aur Outliers Ka Ilaaj',
    teaserText:
      'Agle Sunday: Salim sikhayega ki missing values kaise bhare jaate hain, aur outliers IQR aur 3-sigma rule se kaise pakde jaate hain.',
  },
];

/**
 * Episode 4 — "Kachra Saaf Karo: Missing Values Aur Outliers Ka Ilaaj". Salim
 * teaches at the boundary wall of the mohalla cricket ground: missing-value
 * imputation, duplicates / inconsistent data, and outlier detection (IQR,
 * 3-sigma with the "masking" gotcha, LOF, Isolation Forest). All numbers
 * (Raju's mean 26.6, sigma ~40.3, upper limit ~147.6; the 12-value IQR
 * exam example Q1 = 11, Q3 = 14.5) were verified by computation.
 */
const episode4ContentBlocks: ContentBlock[] = [
  {
    id: 's4-scene-cricket-ground',
    type: 'scene',
    order: 0,
    sceneTitle: 'Mohalle Ka Cricket Ground',
    location: 'Mohalle ka cricket ground, boundary ki tooti hui deewar',
    time: 'Sunday, 9:30 AM',
    sessionLabel: 'Module 2 · Episode 4',
    backgroundTheme: 'neutral',
    ambientDescription:
      'Ground pe bachche match khel rahe hain. Dono deewar pe baithe hain, haath mein Chhotu ki tapri ki cutting chai. Wahi ground, wahi naali, jahan se Salim kabhi gend nikalta tha. Aaj class Salim ki hai, aur wo ise bhoolne nahi dega.',
    transitionStyle: 'fade',
  },
  {
    id: 's4-dialogue-opening',
    type: 'dialogue',
    order: 1,
    lines: [
      {
        id: 'e4d1',
        speaker: 'salim',
        text: 'To beta Shyam, aaj class kiski hai?',
        stageDirection: 'marker ghumate hue',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'e4d2', speaker: 'shyam', text: 'Teri.', emphasis: 'none', displayOrder: 1 },
      { id: 'e4d3', speaker: 'salim', text: 'Zor se bol.', emphasis: 'none', displayOrder: 2 },
      { id: 'e4d4', speaker: 'shyam', text: 'Teri, Salim Sir.', emphasis: 'none', displayOrder: 3 },
      { id: 'e4d5', speaker: 'salim', text: 'Haan. Ab maza aaya.', emphasis: 'bold', displayOrder: 4 },
      {
        id: 'e4d6',
        speaker: 'shyam',
        text: 'Pichhle hafte maine teri diary padh li thi, uska badla le raha hai na?',
        emphasis: 'none',
        displayOrder: 5,
      },
      { id: 'e4d7', speaker: 'salim', text: 'Badla nahi. Education.', emphasis: 'none', displayOrder: 6 },
    ],
  },
  {
    id: 's4-dialogue-recap-500',
    type: 'dialogue',
    order: 2,
    lines: [
      {
        id: 'e4d8',
        speaker: 'salim',
        text: 'Pichhle Sunday tune kachra dikhaya tha: missing values, duplicates, inconsistent data, noise, outliers. Aaj main batata hoon ki is kachre ko saaf kaise karte hain.',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'e4d9', speaker: 'shyam', text: 'Aur mere ₹500?', emphasis: 'none', displayOrder: 1 },
      {
        id: 'e4d10',
        speaker: 'salim',
        text: 'Wahin se shuru karte hain. Tere ₹500 ek missing value hain.',
        emphasis: 'none',
        displayOrder: 2,
      },
      { id: 'e4d11', speaker: 'shyam', text: 'To bhar.', emphasis: 'none', displayOrder: 3 },
      {
        id: 'e4d12',
        speaker: 'salim',
        text: 'Pehla tareeka hai drop kar do. Row hi delete.',
        emphasis: 'none',
        displayOrder: 4,
      },
      { id: 'e4d13', speaker: 'shyam', text: 'Abe ye handling hai ya chori?', emphasis: 'none', displayOrder: 5 },
      {
        id: 'e4d14',
        speaker: 'salim',
        text: 'Dono. Multitasking. Teri hi line hai, yaad hai?',
        emphasis: 'none',
        displayOrder: 6,
      },
    ],
  },
  {
    id: 's4-divider-missing',
    type: 'divider',
    order: 3,
    style: 'scene-break',
    label: '1️⃣ Missing Values Ka Ilaaj',
  },
  {
    id: 's4-table-missing-methods',
    type: 'table',
    order: 4,
    caption: 'Missing values handle karne ke tareeke',
    columns: ['Tareeka', 'Kab use karein', 'Dhyan kahan dena hai'],
    rows: [
      ['Drop rows', 'Bahut kam rows mein value missing ho', 'Zyada rows gayi to data hi khatam'],
      ['Drop column', 'Column ka bada hissa khaali ho (jaise 70–80% blank)', 'Important feature ho to soch ke drop karo'],
      ['Mean se bharo', 'Numerical data, bina outliers ke', 'Outliers mean ko kheench lete hain'],
      ['Median se bharo', 'Numerical data, jab outliers hon', 'Usually safer default'],
      ['Mode se bharo', 'Categorical data (blood group, city)', 'Sabse common value bhar do'],
      ['"Unknown" flag', 'Koi bharosemand andaaza na ho', 'Galat value bharne se ye behtar hai'],
      ['Synthetic data', 'Baaki columns se model andaaza lagaye', 'Jaise KNN-based imputation'],
    ],
  },
  {
    id: 's4-flashback-chanda',
    type: 'flashback',
    order: 5,
    title: 'Mohalla Tournament Ka Chanda',
    dateBadge: '2013',
    bodyMarkdown:
      'Tournament ke liye chanda jama hua tha. Bachchon ne ₹100, ₹150, ₹200 diye the. Phir Sharma Uncle aaye, ₹5,000 diye, aur poore mohalle ko announce bhi kiya.',
    lines: [
      {
        id: 'e4f1',
        speaker: 'shyam',
        text: 'Aur ek bande ke aage likha hi nahi tha ki usne kitna diya.',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'e4f2', speaker: 'salim', text: 'Wahi aaj ka example hai.', emphasis: 'none', displayOrder: 1 },
    ],
    entryAnimation: 'page-turn',
  },
  {
    id: 's4-formula-mean-vs-median',
    type: 'formula',
    order: 6,
    title: 'Salim\'s Blackboard: Mean vs Median',
    formula: 'Mean = (sum of values) / n ;  Median = beech ki value (ya beech ki do values ka average)',
    variables: [{ symbol: 'n', meaning: 'Known values ki ginti (missing ko chhodkar)' }],
    stepByStepExplanation: [
      'Chanda ki list (ek value missing): ₹100, ₹100, ₹150, ₹200, ₹100, ₹5000, ?',
      'Mean = (100 + 100 + 150 + 200 + 100 + 5000) / 6 = 5650 / 6 ≈ ₹942',
      'Values ko line mein lagao: 100, 100, 100, 150, 200, 5000. Beech ki do values hain 100 aur 150.',
      'Median = (100 + 150) / 2 = ₹125',
    ],
    numericalExample: 'Mean ≈ ₹942 (Sharma Uncle ke ₹5,000 ne kheench liya), Median = ₹125 (bachchon ka asli chanda).',
    allowCopy: true,
  },
  {
    id: 's4-dialogue-mean-median',
    type: 'dialogue',
    order: 7,
    lines: [
      {
        id: 'e4d15',
        speaker: 'shyam',
        text: 'Ek bachche ne ₹942 diye? Uski pocket money to ₹50 thi!',
        emphasis: 'none',
        displayOrder: 0,
      },
      {
        id: 'e4d16',
        speaker: 'salim',
        text: 'Bas. Sharma Uncle ke ₹5,000 ne average ko apni taraf kheench liya. Median sirf beech wala number dekhta hai, isliye ek bada number use bigaad nahi paata.',
        emphasis: 'bold',
        displayOrder: 1,
      },
      { id: 'e4d17', speaker: 'shyam', text: 'Matlab outliers hon to median.', emphasis: 'none', displayOrder: 2 },
      {
        id: 'e4d18',
        speaker: 'salim',
        text: 'Aur blood group jaise category ke liye na mean chalega na median. Wahan mode, yaani jo sabse zyada baar aaya.',
        emphasis: 'none',
        displayOrder: 3,
      },
      { id: 'e4d19', speaker: 'shyam', text: 'Aur agar koi andaaza hi na ho?', emphasis: 'none', displayOrder: 4 },
      {
        id: 'e4d20',
        speaker: 'salim',
        text: 'To seedha "Unknown" likh do. Jhooth bharne se imaandaar "Unknown" behtar hai.',
        emphasis: 'none',
        displayOrder: 5,
      },
    ],
  },
  {
    id: 's4-divider-duplicates',
    type: 'divider',
    order: 8,
    style: 'scene-break',
    label: '2️⃣ Duplicates Aur Inconsistent Data',
  },
  {
    id: 's4-dialogue-duplicates',
    type: 'dialogue',
    order: 9,
    lines: [
      { id: 'e4d21', speaker: 'shyam', text: 'Aur tere teen Salim?', emphasis: 'none', displayOrder: 0 },
      {
        id: 'e4d22',
        speaker: 'salim',
        text: 'Haan haan. Email ya phone jaisi unique cheez se pehchano ki ek hi banda hai, aur ek hi record rakho.',
        stageDirection: 'chidhkar',
        emphasis: 'none',
        displayOrder: 1,
      },
      { id: 'e4d23', speaker: 'shyam', text: 'Aur y, Yes, YES, yes?', emphasis: 'none', displayOrder: 2 },
      {
        id: 'e4d24',
        speaker: 'salim',
        text: 'Sabko ek format mein badal do, jaise "Yes". Dates ko ek format mein (YYYY-MM-DD), units ko ek mein (sab kg). Aur "AI" aur "Artificial Intelligence" ko ek naam do.',
        emphasis: 'bold',
        displayOrder: 3,
      },
    ],
  },
  {
    id: 's4-divider-outliers',
    type: 'divider',
    order: 10,
    style: 'scene-break',
    label: '3️⃣ Outlier Detection: Raju Ka Postmortem',
  },
  {
    id: 's4-dialogue-raju-postmortem',
    type: 'dialogue',
    order: 11,
    lines: [
      { id: 'e4d25', speaker: 'salim', text: 'Ab asli kaam. Raju ka postmortem.', emphasis: 'none', displayOrder: 0 },
      {
        id: 'e4d26',
        speaker: 'shyam',
        text: 'Bechara Raju. Usne bas 147 maare the.',
        emphasis: 'none',
        displayOrder: 1,
      },
      {
        id: 'e4d27',
        speaker: 'salim',
        text: 'Aur aaj maths batayega ki wo kitna "alag" tha.',
        emphasis: 'none',
        displayOrder: 2,
      },
    ],
  },
  {
    id: 's4-formula-iqr',
    type: 'formula',
    order: 12,
    title: 'Salim\'s Blackboard: IQR Method',
    formula: 'IQR = Q_3 - Q_1 ;  Lower = Q_1 - 1.5 * IQR ;  Upper = Q_3 + 1.5 * IQR',
    variables: [
      { symbol: 'Q_1', meaning: '25% data isse neeche hai' },
      { symbol: 'Q_3', meaning: '75% data isse neeche hai' },
      { symbol: 'IQR', meaning: 'Beech ke 50% data ka spread' },
    ],
    stepByStepExplanation: [
      '2012 ke match ke 10 scores, sort karke: 8, 9, 10, 11, 12, 14, 15, 18, 22, 147',
      'Step 1: Data ko do halves mein todo. Neeche ka half: 8, 9, 10, 11, 12 → Q1 = 10. Upar ka half: 14, 15, 18, 22, 147 → Q3 = 18.',
      'Step 2: IQR = Q3 − Q1 = 18 − 10 = 8',
      'Step 3: Lower bound = 10 − 1.5 × 8 = −2. Upper bound = 18 + 1.5 × 8 = 30.',
      'Step 4: Jo value range ke bahar hai, wo outlier. 147 > 30 → Raju officially outlier hai. ✅',
    ],
    numericalExample: 'Range −2 se 30. Raju ke 147 runs 30 se bahut upar hain, isliye outlier.',
    allowCopy: true,
  },
  {
    id: 's4-banter-postmortem',
    type: 'banter',
    order: 13,
    speaker: 'salim',
    text: 'Postmortem complete. Raju officially outlier hai. (Shyam: Raju ko pata chala to tujhe naali mein phenk dega. Salim: Main wahan pehle bhi reh chuka hoon. Comfortable hoon.)',
    reactionEmoji: '😂',
  },
  {
    id: 's4-table-three-sigma',
    type: 'table',
    order: 14,
    caption: 'Salim\'s Blackboard: 3-Sigma Rule (normal distribution / bell curve)',
    columns: ['Range', 'Kitna data aata hai'],
    rows: [
      ['μ ± 1σ', '~68%'],
      ['μ ± 2σ', '~95%'],
      ['μ ± 3σ', '~99.7%'],
    ],
    note: 'Rule: jo value μ − 3σ se neeche ya μ + 3σ se upar hai, use outlier maano.',
  },
  {
    id: 's4-example-chhotu-tapri',
    type: 'example',
    order: 15,
    title: 'Chhotu Ki Tapri: 3-Sigma in Action',
    scenario: 'Chhotu ki tapri pe roz average 200 chai bikti hai (μ = 200), σ = 20.',
    walkthroughMarkdown:
      'Normal range = 200 ± 3(20) = **140 se 260**. India–Pakistan match wale din 320 cup bike. 320 > 260, isliye wo din outlier hai.',
    outcome: 'Outlier hai, galat nahi: match ka din real tha.',
  },
  {
    id: 's4-dialogue-masking',
    type: 'dialogue',
    order: 16,
    lines: [
      {
        id: 'e4d28',
        speaker: 'shyam',
        text: 'To Raju ko bhi 3-sigma se pakad lete hain.',
        emphasis: 'none',
        displayOrder: 0,
      },
      { id: 'e4d29', speaker: 'salim', text: 'Koshish kar.', emphasis: 'none', displayOrder: 1 },
      {
        id: 'e4d30',
        speaker: 'shyam',
        text: 'Mean = 26.6, σ ≈ 40.3. Upper limit = 26.6 + 3 × 40.3 ≈ 147.6...',
        stageDirection: 'calculator dabate hue',
        emphasis: 'none',
        displayOrder: 2,
      },
      {
        id: 'e4d31',
        speaker: 'shyam',
        text: 'Abe! 147 to andar aa gaya!',
        reaction: 'shock',
        emphasis: 'bold',
        displayOrder: 3,
      },
      {
        id: 'e4d32',
        speaker: 'salim',
        text: 'Raju 3-sigma se bach nikla. 😄',
        emphasis: 'highlight',
        conceptRef: 'masking',
        displayOrder: 4,
      },
    ],
  },
  {
    id: 's4-concept-masking',
    type: 'concept',
    order: 17,
    conceptName: 'Masking',
    anchorId: 'masking',
    simpleDefinition: 'Outlier itna bada hota hai ki wo khud mean aur σ ko bada kar deta hai, aur apne aap ko chhupa leta hai.',
    technicalDefinition:
      'A failure mode of mean/standard-deviation based detectors (like the 3-sigma rule): an extreme value inflates both the mean and σ, widening the acceptance range enough that the outlier itself falls inside it. Robust statistics (median, quartiles, as in IQR) are not distorted this way.',
    realWorldExample:
      'Raju ke 147 ne mean ko 26.6 aur σ ko ≈ 40.3 kar diya, to upper limit ≈ 147.6 ho gayi aur 147 "normal" nikla. IQR (upper bound 30) ne use aaram se pakad liya.',
    relatedTerms: ['3-sigma rule', 'IQR', 'robust statistics'],
    bookmarkable: true,
  },
  {
    id: 's4-confusion-iqr-vs-sigma',
    type: 'confusion',
    order: 18,
    misconception: '3-sigma rule aur IQR dono hamesha same outliers pakadte hain, bas formula alag hai.',
    clarification:
      'IQR median aur quartiles pe chalta hai, isliye ek bada number use bewakoof nahi bana pata. 3-sigma mean aur standard deviation pe chalta hai, jo khud outliers se bigad jaate hain (masking). 3-sigma tab achha kaam karta hai jab data bada ho aur lagbhag bell curve jaisa ho.',
    relatedConceptRef: 'masking',
  },
  {
    id: 's4-divider-lof-iforest',
    type: 'divider',
    order: 19,
    style: 'scene-break',
    label: '4️⃣ LOF Aur Isolation Forest',
  },
  {
    id: 's4-dialogue-lof-iforest',
    type: 'dialogue',
    order: 20,
    lines: [
      { id: 'e4d33', speaker: 'shyam', text: 'Aur ye LOF aur Isolation Forest kya hain?', emphasis: 'none', displayOrder: 0 },
      {
        id: 'e4d34',
        speaker: 'salim',
        text: 'LOF, yaani Local Outlier Factor. Soch, mohalle mein saare ghar paas-paas hain, aur ek ghar khet ke beech akela khada hai.',
        emphasis: 'none',
        displayOrder: 1,
      },
      { id: 'e4d35', speaker: 'shyam', text: 'Verma ji ka ghar.', emphasis: 'none', displayOrder: 2 },
      {
        id: 'e4d36',
        speaker: 'salim',
        text: 'Bilkul. LOF dekhta hai ki kisi point ke aas-paas kitni bheed hai, uske padosiyon ke mukable. Agar uske aas-paas bheed bahut kam hai, to wo outlier.',
        conceptRef: 'lof',
        emphasis: 'bold',
        displayOrder: 3,
      },
      { id: 'e4d37', speaker: 'shyam', text: 'Aur Isolation Forest?', emphasis: 'none', displayOrder: 4 },
      {
        id: 'e4d38',
        speaker: 'salim',
        text: '20 sawaal wala game yaad hai? Mohalle ke kisi aam ladke ko pehchanne mein bahut sawaal lagte hain.',
        emphasis: 'none',
        displayOrder: 5,
      },
      { id: 'e4d39', speaker: 'shyam', text: 'Aur Raju ko?', emphasis: 'none', displayOrder: 6 },
      {
        id: 'e4d40',
        speaker: 'salim',
        text: 'Ek hi sawaal. "Jisne 147 maare?" Raju!',
        emphasis: 'highlight',
        displayOrder: 7,
      },
    ],
  },
  {
    id: 's4-table-outlier-methods',
    type: 'table',
    order: 21,
    caption: 'Outlier detection methods ek nazar mein',
    columns: ['Method', 'Idea', 'Kab use karein'],
    rows: [
      ['IQR', 'Q1 aur Q3 se range, uske bahar outlier', 'Chhota data, skewed data, robust default'],
      ['3-sigma', 'Mean se 3σ se door, outlier', 'Bada, lagbhag normal data'],
      ['LOF', 'Neighbourhood ki density compare karo', 'Clusters wala data, local outliers'],
      ['Isolation Forest', 'Random splits se jo jaldi alag ho jaye, wo outlier', 'Bada, high-dimensional data'],
    ],
  },
  {
    id: 's4-examtip-verify-before-delete',
    type: 'examTip',
    order: 22,
    tip: 'Outlier pakadna aur delete karna alag cheezein hain. Pehle check karo ki wo galti hai ya asli. Raju asli tha.',
    importance: 'high',
  },
  {
    id: 's4-example-iqr-exam',
    type: 'example',
    order: 23,
    title: 'Exam-style question: IQR method se outliers dhoondo',
    scenario: 'Data: 10, 2, 11, 15, 11, 14, 13, 17, 12, 22, 14, 11. IQR method se outliers dhoondo.',
    walkthroughMarkdown:
      'Sorted (n = 12): 2, 10, 11, 11, 11, 12, 13, 14, 14, 15, 17, 22. Lower half: 2, 10, 11, 11, 11, 12 → Q1 = (11 + 11)/2 = **11**. Median = (12 + 13)/2 = 12.5. Upper half: 13, 14, 14, 15, 17, 22 → Q3 = (14 + 15)/2 = **14.5**. IQR = 14.5 − 11 = **3.5**. Lower bound = 11 − 1.5(3.5) = **5.75**. Upper bound = 14.5 + 1.5(3.5) = **19.75**.',
    outcome:
      'Outliers: 2 aur 22. Note: quartile nikalne ke alag-alag methods hain, aur kuch thode alag Q1/Q3 dete hain. Jaise (n + 1) wala method Q3 = 14.75 deta hai. Is example mein dono methods se outliers same aate hain. Exam mein jo method use karo, likh do.',
  },
  {
    id: 's4-summary-recap',
    type: 'summary',
    order: 24,
    title: 'Aaj Salim Ne Shyam Ko Kya Sikhaya?',
    points: [
      'Missing values: thodi hon to drop, warna bharo. Numbers mein outliers hon to median, warna mean. Categories mein mode. Andaaza na ho to "Unknown".',
      'Duplicates: unique key se pehchano, ek record rakho.',
      'Inconsistent data: categories, dates aur units ko ek standard format mein lao.',
      'IQR: Q1 − 1.5×IQR se Q3 + 1.5×IQR ke bahar ki values outlier hain.',
      '3-sigma: normal data mein μ ± 3σ ke bahar outlier. Bade outliers mean aur σ ko bigaad ke khud chhup sakte hain (masking).',
      'LOF aur Isolation Forest: bade aur complex data ke liye. LOF density dekhta hai, Isolation Forest dekhta hai ki point kitni jaldi alag ho jaata hai.',
      'Outlier mile to pehle verify karo, phir decide karo.',
    ],
  },
  {
    id: 's4-quiz-episode-4',
    type: 'quiz',
    order: 25,
    title: 'Chai Break Quiz ☕',
    questions: [
      {
        id: 'e4q1',
        questionType: 'multiple-choice',
        prompt:
          'Ek company ke salary column mein kuch values missing hain, aur CEO ki salary baaki sab se bahut zyada hai. Mean se bharoge ya median se?',
        options: [
          { id: 'a', text: 'Mean se' },
          { id: 'b', text: 'Median se' },
        ],
        correctOptionId: 'b',
        explanation: 'Median. CEO ki salary mean ko upar kheench legi, median pe uska asar nahi padta.',
      },
      {
        id: 'e4q2',
        questionType: 'true-false',
        prompt: 'Q1 = 20, Q3 = 40. Kya 75 outlier hai?',
        correctAnswer: true,
        explanation: 'Haan. IQR = 20, upper bound = 40 + 1.5 × 20 = 70. 75 > 70.',
      },
      {
        id: 'e4q3',
        questionType: 'true-false',
        prompt: 'μ = 50, σ = 5, data normal hai. Kya 68 outlier hai?',
        correctAnswer: true,
        explanation: 'Haan. 3-sigma range 35 se 65 hai, aur 68 usse bahar hai.',
      },
      {
        id: 'e4q4',
        questionType: 'short-answer',
        prompt: '"Favourite colour" column mein missing values hain. Kaise bharoge?',
        acceptableAnswers: ['mode', 'unknown', 'most common', 'most frequent'],
        explanation:
          'Mode se, yaani sabse common colour se. Ya agar andaaza na ho to "Unknown" likho. Mean ya median categorical data pe meaningful nahi hain.',
      },
    ],
  },
  {
    id: 's4-homework-episode-4',
    type: 'homework',
    order: 26,
    dueLabel: 'Comments mein batao',
    difficulty: 'medium',
    tasks: [
      'Pichhle 10 din ka apna screen time (ghanton mein) likho.',
      'IQR method se check karo ki koi din outlier hai ya nahi.',
      'Comments mein batao: kaunsa din outlier nikla, aur us din kya hua tha? 😄',
    ],
  },
  {
    id: 's4-dialogue-teaser-banter',
    type: 'dialogue',
    order: 27,
    lines: [
      { id: 'e4d41', speaker: 'shyam', text: 'Agli baar class meri.', emphasis: 'none', displayOrder: 0 },
      { id: 'e4d42', speaker: 'salim', text: 'Kya padhayega?', emphasis: 'none', displayOrder: 1 },
      {
        id: 'e4d43',
        speaker: 'shyam',
        text: 'Data saaf to ho gaya, lekin abhi bhi kachcha hai. Agle Sunday data ko pakayenge. Smoothing, aggregation, discretization, aur scaling.',
        emphasis: 'none',
        displayOrder: 2,
      },
      { id: 'e4d44', speaker: 'salim', text: 'Data pakayenge?', emphasis: 'none', displayOrder: 3 },
      {
        id: 'e4d45',
        speaker: 'shyam',
        text: 'Haan. Aur teri salary aur meri age ko ek hi taraazu pe taulenge.',
        emphasis: 'none',
        displayOrder: 4,
      },
      { id: 'e4d46', speaker: 'salim', text: 'Aur tere ₹500?', emphasis: 'none', displayOrder: 5 },
      {
        id: 'e4d47',
        speaker: 'shyam',
        text: 'Maine median se bhar diye. Ab tu mujhe ₹125 deta hai.',
        emphasis: 'bold',
        displayOrder: 6,
      },
      { id: 'e4d48', speaker: 'salim', text: 'Ye kaunsa maths hai!', emphasis: 'none', displayOrder: 7 },
    ],
  },
  {
    id: 's4-teaser-next-episode',
    type: 'teaser',
    order: 28,
    nextEpisodeTitle: 'Data Ki Rasoi: Smoothing, Aggregation Aur Scaling',
    teaserText:
      'Agle Sunday: Shyam padhayega smoothing, aggregation, discretization, attribute construction aur scaling. Data ko pakane ka waqt aa gaya hai.',
  },
];

/**
 * Episode 3's full multi-voice audio-drama script. Rewritten in a more
 * natural, contraction-heavy register for two Indian men in their
 * mid-twenties — quick back-and-forth, trailing sentences, laughter
 * breaking mid-line — rather than the more formal cadence of the text
 * version above. `url` is intentionally left unset: recording or
 * generating the actual audio (e.g. with a TTS tool or voice actors) is a
 * production step outside this app. Paste the resulting file's URL into
 * the admin "Audio file URL" field once it exists.
 */
const episode3Audio = {
  durationLabel: '7 min listen',
  voiceCast: [
    {
      character: 'shyam' as const,
      voiceDirection:
        'Male, 25-27, Indian. Confident, dry, a half-second delay before the punchline lands. Talks like he already knows he\'s right. Natural Hindi-English code-switching, not textbook-correct — drops word endings the way people actually do ("kahan se mila", not over-enunciated).',
    },
    {
      character: 'salim' as const,
      voiceDirection:
        'Male, 24-26, Indian. Quicker, more reactive, voice jumps up when caught off guard or defensive. Laughs easily and often mid-sentence. Slightly higher energy than Shyam — the one who gets flustered first.',
    },
    {
      character: 'narrator' as const,
      voiceDirection:
        'Warm, unhurried, almost like a friend setting the scene over chai — not a formal announcer voice. Used only for scene-setting; can be dropped entirely if sound effects carry the scene.',
    },
  ],
  script: `[SFX: Halki baarish. Chai ke cups ki khanak.]
NARRATOR: Sunday shaam, saade paanch baje. Salim ka drawing room. Baahar baarish, andar chai aur samose. Aur Shyam ke haath mein ek purana register.
SALIM: (suspicious) Ye register kahan se mila tujhe?
SHYAM: (casual) Teri almari mein. Teri purani diary ke neeche.
SALIM: (shocked) Tune meri diary padhi?!
SHYAM: Nahi yaar. Bas pehla page dekha. (pause, reading slowly) "Meri zindagi ka maqsad: Sachin banna."
SALIM: (embarrassed) Wo Class 6 mein likha tha!
SHYAM: Aur ye register bata raha hai tu Class 6 mein bhi Sachin nahi tha. (page flip SFX) Chal, aaj ka data yahi hai.
[Beat]
SHYAM: Dekh, pichhle hafte tune mujhe attribute types padhaye. Aaj main ek sawaal poochta hoon. Data hai, type bhi pata hai. Phir bhi model galat seekh sakta hai?
SALIM: Haan... agar data hi kharab ho.
SHYAM: Bas. Aaj usi kachre ki baat karenge. Data mein paanch tarah ka kachra hota hai. Missing values, duplicates, inconsistent data, noise, aur outliers.
[SFX: Page flip]
SHYAM: 2011 ka final match. Teri batting ke aage kya likha hai?
SALIM: (leaning in, pause) ...Kuch nahi. Khaali hai.
SHYAM: Kyun?
SALIM: Shayad scorer bhool gaya.
SHYAM: (deadpan) Ya shayad tu zero pe out hua aur tune khud page se mita diya.
SALIM: (offended) Ye allegation hai!
SHYAM: (laughing) Ye missing value hai. Aur samajh, data missing kyun hota hai. Kabhi log jaante hi nahi, jaise kisi se blood group poocho aur usse pata hi nahi. Kabhi batana nahi chahte, jaise salary. Kabhi form bharne wala field skip kar deta hai. Aur kabhi website pe submit karte waqt data hi lost ho jaata hai.
SALIM: Matlab missing kyun hai, ye bhi important hai?
SHYAM: Bilkul. Kyunki usi se decide hoga ki use bharna kaise hai. Wo agle hafte.
[SFX: Page flip]
SHYAM: Ab ye dekh. Season ke players ki list.
SALIM: (reading) Salim Khan... Salim K.... S. Khan... (confused) teen Salim?
SHYAM: Teeno tu hi hai.
SALIM: To?
SHYAM: To club ke records ke hisaab se teen alag Salim ne milke us season mein 12 run banaye.
SALIM: (irritated laugh) Tu insult kar raha hai ya padha raha hai?
SHYAM: Dono. Multitasking.
SHYAM: (serious again) Ye duplicate data hai. Socho ek shopping dataset mein ek hi customer paanch baar aa gaya. Model sochega aise paanch customers hain, aur us ek bande ka behaviour zarurat se zyada important ho jayega.
SALIM: Matlab model ek bande ko poori public samajh lega.
SHYAM: Bilkul. Jaise maine ek baar Ammi ki biryani ki tareef ki thi, aur ab har Eid pe teen plate aati hain.
SALIM: (warm) Wo duplicate nahi hai. Wo pyaar hai.
SHYAM: Model ke liye dono same hain.
[Beat]
SHYAM: Ab "Match jeeta?" wala column dekh.
SALIM: (reading quickly) y... Yes... YES... yes... Y... haan...
SHYAM: Humein pata hai sab ka matlab ek hai. Computer ko?
SALIM: Computer ko chhe alag answer dikhenge.
SHYAM: Exactly. Isko bolte hain inconsistent data. Same cheez, alag tarah likhi hui. Dates mein bhi hota hai. Kahin pandrah August, kahin 2011-08-15, kahin slash wala format.
SALIM: (grinning) Waise hi jaise tu mera number teen naam se save karta hai. Salim, Salim Bhai, aur... Salim Udhaar.
SHYAM: "Salim Udhaar" sabse accurate attribute hai. Paanch sau rupaye abhi tak pending hain.
SALIM: (groans) Phir se shuru...
[SFX: Page flip]
SHYAM: Ab age column dekh.
SALIM: Chaudah... pandrah... terah... (pause) minus sau? Teen sau pachaas? Aur... "ABC"?
SHYAM: Bata, kya galat hai?
SALIM: Minus sau saal ka koi nahi hota! Teen sau pachaas saal ka bowler bhi nahi tha. Aur ABC age kaise ho sakti hai?
SHYAM: Wo Pappu ne bhara tha. Usse laga form mein initials maangi hain.
SALIM: Pappu ab kya karta hai?
SHYAM: (deadpan) Data entry operator hai.
SALIM: (chokes on chai, coughing laugh) Isliye duniya ka data kharab hai!
SHYAM: (laughing) Ye noise hai. Aisi values jo reality mein ho hi nahi sakti, galti se aa gayi. Jaise sensor 30 degree dikha raha tha aur achaanak 75 bol diya.
[Beat]
SALIM: (excited) Ruk ruk, ye dekh! 2012. Raju, ek sau saintaalis runs! Baaki sab ke das, pandrah, aath... Ye bhi noise hai na? Gully cricket mein 147 kaun banata hai?
SHYAM: (calm) Raju ne banaya tha. Main wahan tha. Tu bhi wahan tha.
SALIM: Main?
SHYAM: Haan. Tu fielding karte waqt naali mein gend dhoondh raha tha.
SALIM: (long pause) ...Haan. Yaad aaya.
SHYAM: Yahi fark samajh. 147 baaki values se bahut alag hai, isliye outlier hai. Lekin galat nahi hai. Real hai.
SALIM: To noise aur outlier mein fark kya hai?
SHYAM: (slow, clear, the key line) Noise wo hai jo ho hi nahi sakta, ya galti se aaya. Outlier wo hai jo ho sakta hai, bas baaki sab se bahut alag hai. Jaise company mein CEO ki salary.
SALIM: To outlier mila to delete nahi karna?
SHYAM: Pehle check kar. Typing ki galti hai? Real hai par rare hai? Aur fraud detection mein to outlier hi dhoondhna hota hai. Delete kar diya to chor bhi saath mein delete.
[Beat. SFX: Rain softening.]
SALIM: Theek hai teacher sahab. To aaj ka summary?
SHYAM: Missing values, value hi nahi hai. Duplicates, ek record baar-baar. Inconsistent, same cheez alag format mein. Noise, galat ya impossible values. Aur outliers, bahut alag values, jo galat hon ye zaroori nahi. Aur ye sab saaf kiye bina model banaya to?
SALIM: (together, tired) Garbage in, garbage out.
SHYAM: Shabaash.
[Beat]
SALIM: Agli baar meri class. Aur main batāunga ki is kachre ko saaf kaise karte hain. Missing values kaise bharte hain, aur outlier kaise pakadte hain. IQR aur three-sigma rule se.
SHYAM: Aur Raju ke 147 runs?
SALIM: (mock-serious) Unka bhi postmortem hoga. Maths se.
SHYAM: (laughing) Aur mere paanch sau?
SALIM: Wo missing value hai. Permanently.
[SFX: Both laughing. Rain fades out.]
NARRATOR: Agle Sunday: "Kachra Saaf Karo." Missing values aur outliers ka ilaaj. Tab tak, chai peete raho, seekhte raho.`,
};

async function seed(): Promise<void> {
  const parsed = contentBlocksSchema.safeParse(contentBlocks);
  if (!parsed.success) {
    console.error('Seed content blocks failed validation:');
    console.error(parsed.error.format());
    process.exit(1);
  }

  const parsedEpisode2 = contentBlocksSchema.safeParse(episode2ContentBlocks);
  if (!parsedEpisode2.success) {
    console.error('Episode 2 seed content blocks failed validation:');
    console.error(parsedEpisode2.error.format());
    process.exit(1);
  }

  const parsedEpisode3 = contentBlocksSchema.safeParse(episode3ContentBlocks);
  if (!parsedEpisode3.success) {
    console.error('Episode 3 seed content blocks failed validation:');
    console.error(parsedEpisode3.error.format());
    process.exit(1);
  }

  const parsedEpisode3Audio = episodeAudioSchema.safeParse(episode3Audio);
  if (!parsedEpisode3Audio.success) {
    console.error('Episode 3 audio script failed validation:');
    console.error(parsedEpisode3Audio.error.format());
    process.exit(1);
  }

  const parsedEpisode4 = contentBlocksSchema.safeParse(episode4ContentBlocks);
  if (!parsedEpisode4.success) {
    console.error('Episode 4 seed content blocks failed validation:');
    console.error(parsedEpisode4.error.format());
    process.exit(1);
  }

  await ensureAllIndexes();
  const db = await getDb();

  const now = new Date();

  const seriesSlug = toSlug('Machine Learning with Shyam and Salim');
  const seriesResult = await db.collection<Omit<SeriesDocument, '_id'>>(COLLECTIONS.SERIES).findOneAndUpdate(
    { slug: seriesSlug },
    {
      $set: {
        title: 'Machine Learning with Shyam and Salim',
        description:
          'Har Sunday, Shyam aur Salim ek-doosre ko Machine Learning sikhate hain — ek module, ek episode, ek Sunday at a time.',
        shortDescription: 'Do dost, ek chai, aur Machine Learning — module by module.',
        status: 'published',
        displayOrder: 0,
      },
      $setOnInsert: { createdAt: now, totalModules: 1 },
      $currentDate: { updatedAt: true },
    },
    { upsert: true, returnDocument: 'after' },
  );
  const series = seriesResult!;
  const seriesId = series._id.toHexString();

  const moduleSlug = toSlug('Module 2 Understanding and Preparing Data');
  const moduleResult = await db.collection<Omit<ModuleDocument, '_id'>>(COLLECTIONS.MODULES).findOneAndUpdate(
    { seriesId, slug: moduleSlug },
    {
      $set: {
        title: 'Module 2: Understanding and Preparing Data',
        description: 'Data objects, attributes, GIGO, aur data preparation ke fundamentals.',
        moduleNumber: 2,
        displayOrder: 1,
        status: 'published',
      },
      $setOnInsert: { createdAt: now },
      $currentDate: { updatedAt: true },
    },
    { upsert: true, returnDocument: 'after' },
  );
  const moduleDoc = moduleResult!;
  const moduleId = moduleDoc._id.toHexString();

  const episodeSlug = toSlug('Machine Learning Mein Data Ki Aukaat');
  const readingTime = calculateReadingTime(parsed.data);

  await db.collection<Omit<EpisodeDocument, '_id'>>(COLLECTIONS.EPISODES).findOneAndUpdate(
    { slug: episodeSlug },
    {
      $set: {
        seriesId,
        moduleId,
        seriesSlug,
        seriesTitle: series.title,
        moduleSlug,
        moduleTitle: moduleDoc.title,
        title: 'Machine Learning Mein Data Ki Aukaat',
        subtitle: 'Pehla Sunday: GIGO, data objects, aur attributes — chai aur pakode ke saath',
        episodeNumber: 1,
        teacherCharacter: 'shyam',
        studentCharacter: 'salim',
        excerpt:
          'Ek Sunday subah, Shyam bina bataye Salim ke ghar chai peene aa jaata hai — aur usi pakoda-aur-chai ke beech samjhata hai ki Machine Learning mein "data ki aukaat" kyun sabse pehle aati hai.',
        location: "Salim's dining table",
        sessionDate: new Date('2026-02-08T05:45:00.000Z'),
        readingTime,
        contentBlocks: parsed.data,
        tags: ['data', 'fundamentals', 'gigo'],
        concepts: ['garbage-in-garbage-out', 'data-object', 'attribute'],
        status: 'published',
        // Published at the episode's own session date, not "now" — two
        // episodes seeded in the same script run must not share a
        // publishedAt timestamp, or "latest episode" queries (sorted by
        // publishedAt) have no stable winner.
        publishedAt: new Date('2026-02-08T05:45:00.000Z'),
        featured: false,
        seo: {
          metaTitle: 'Machine Learning Mein Data Ki Aukaat',
          metaDescription:
            'Shyam aur Salim samjhate hain GIGO, data objects aur attributes — Machine Learning ki sabse zaroori buniyaad.',
          noIndex: false,
        },
        createdBy: SEED_ACTOR,
        updatedBy: SEED_ACTOR,
      },
      $setOnInsert: { createdAt: now, revision: 1 },
      $currentDate: { updatedAt: true },
    },
    { upsert: true, returnDocument: 'after' },
  );

  const episode2Slug = toSlug('Bengaluru Lucknow Data Ke Types Ki Kahani');
  const readingTime2 = calculateReadingTime(parsedEpisode2.data);

  await db.collection<Omit<EpisodeDocument, '_id'>>(COLLECTIONS.EPISODES).findOneAndUpdate(
    { slug: episode2Slug },
    {
      $set: {
        seriesId,
        moduleId,
        seriesSlug,
        seriesTitle: series.title,
        moduleSlug,
        moduleTitle: moduleDoc.title,
        title: 'Bengaluru + Lucknow = ? | Data Ke Types Ki Kahani',
        subtitle: 'Doosra Sunday: Nominal, Ordinal, Interval, Ratio aur Discrete vs Continuous',
        episodeNumber: 2,
        teacherCharacter: 'salim',
        studentCharacter: 'shyam',
        excerpt:
          'Is hafte roles badal gaye hain — Salim sikhata hai, Shyam seekhta hai. Chhat par parathon ke beech, dono seekhte hain ki har attribute pe har mathematical operation meaningful kyun nahi hota.',
        location: "Shyam's rooftop",
        sessionDate: new Date('2026-02-15T05:15:00.000Z'),
        readingTime: readingTime2,
        contentBlocks: parsedEpisode2.data,
        tags: ['data', 'attributes', 'data-types'],
        concepts: ['nominal-attribute', 'ordinal-attribute', 'interval-attribute', 'ratio-attribute'],
        status: 'published',
        publishedAt: new Date('2026-02-15T05:15:00.000Z'),
        featured: false,
        seo: {
          metaTitle: 'Bengaluru + Lucknow = ? | Data Ke Types Ki Kahani',
          metaDescription:
            'Salim aur Shyam samjhate hain nominal, ordinal, interval aur ratio attributes — aur discrete vs continuous data — Machine Learning ki zaroori buniyaad.',
          noIndex: false,
        },
        createdBy: SEED_ACTOR,
        updatedBy: SEED_ACTOR,
      },
      $setOnInsert: { createdAt: now, revision: 1 },
      $currentDate: { updatedAt: true },
    },
    { upsert: true, returnDocument: 'after' },
  );

  const episode3Slug = toSlug('Data Mein Kachra Kahan Se Aata Hai');
  const readingTime3 = calculateReadingTime(parsedEpisode3.data);

  await db.collection<Omit<EpisodeDocument, '_id'>>(COLLECTIONS.EPISODES).findOneAndUpdate(
    { slug: episode3Slug },
    {
      $set: {
        seriesId,
        moduleId,
        seriesSlug,
        seriesTitle: series.title,
        moduleSlug,
        moduleTitle: moduleDoc.title,
        title: 'Data Mein Kachra Kahan Se Aata Hai?',
        subtitle: 'Teesra Sunday: Missing values, duplicates, inconsistent data, noise aur outliers',
        episodeNumber: 3,
        teacherCharacter: 'shyam',
        studentCharacter: 'salim',
        excerpt:
          'Baarish wali Sunday shaam, ek purana mohalla cricket register nikalta hai aur Shyam, Salim ko dikhata hai ki data mein paanch tarah ka kachra kahan chhupa hota hai.',
        location: "Salim's drawing room",
        sessionDate: new Date('2026-02-22T12:00:00.000Z'),
        readingTime: readingTime3,
        contentBlocks: parsedEpisode3.data,
        // Audio deliberately NOT attached for this episode — the TTS
        // pipeline (Indic Parler-TTS, Edge TTS, Google Chirp 3 HD) is
        // still being evaluated for accent/expressiveness quality.
        // `episode3Audio` above (still validated, just above) and the
        // scripts under scripts/tts/ remain ready to use once a pipeline
        // is settled; EpisodeAudioPlayer only renders when `audio` is
        // present on the document, so leaving it unset here is enough to
        // keep it off the public page — no UI code change needed.
        tags: ['data', 'data-quality', 'data-cleaning'],
        concepts: ['missing-values', 'duplicate-data', 'inconsistent-data', 'noise', 'outlier'],
        status: 'published',
        publishedAt: new Date('2026-02-22T12:00:00.000Z'),
        featured: true,
        seo: {
          metaTitle: 'Data Mein Kachra Kahan Se Aata Hai?',
          metaDescription:
            'Shyam aur Salim samjhate hain data quality issues — missing values, duplicates, inconsistent data, noise aur outliers.',
          noIndex: false,
        },
        createdBy: SEED_ACTOR,
        updatedBy: SEED_ACTOR,
      },
      // Explicitly removes any `audio` field a previous seed run may have
      // already written for this episode — $set alone only adds/updates
      // listed fields, it doesn't clear ones left out.
      $unset: { audio: '' },
      $setOnInsert: { createdAt: now, revision: 1 },
      $currentDate: { updatedAt: true },
    },
    { upsert: true, returnDocument: 'after' },
  );

  const episode4Slug = toSlug('Kachra Saaf Karo Missing Values Aur Outliers Ka Ilaaj');
  const readingTime4 = calculateReadingTime(parsedEpisode4.data);

  await db.collection<Omit<EpisodeDocument, '_id'>>(COLLECTIONS.EPISODES).findOneAndUpdate(
    { slug: episode4Slug },
    {
      $set: {
        seriesId,
        moduleId,
        seriesSlug,
        seriesTitle: series.title,
        moduleSlug,
        moduleTitle: moduleDoc.title,
        title: 'Kachra Saaf Karo: Missing Values Aur Outliers Ka Ilaaj',
        subtitle: 'Chautha Sunday: Missing values, duplicates, inconsistent data aur outlier detection (IQR, 3-sigma, LOF, Isolation Forest)',
        episodeNumber: 4,
        teacherCharacter: 'salim',
        studentCharacter: 'shyam',
        excerpt:
          'Mohalle ke cricket ground ki tooti deewar pe, cutting chai ke saath, Salim apna badla leta hai aur Shyam ko sikhata hai ki missing values kaise bharte hain aur Raju ke 147 runs ka maths se postmortem kaise hota hai.',
        location: 'Mohalle ka cricket ground, boundary ki tooti hui deewar',
        // 9:30 AM IST on Sunday 2026-03-01.
        sessionDate: new Date('2026-03-01T04:00:00.000Z'),
        readingTime: readingTime4,
        contentBlocks: parsedEpisode4.data,
        tags: ['data', 'data-cleaning', 'missing-values', 'outliers'],
        concepts: ['missing-values', 'imputation', 'iqr', 'three-sigma-rule', 'masking', 'lof', 'isolation-forest'],
        status: 'published',
        publishedAt: new Date('2026-03-01T04:00:00.000Z'),
        featured: false,
        seo: {
          metaTitle: 'Kachra Saaf Karo: Missing Values Aur Outliers Ka Ilaaj',
          metaDescription:
            'Salim aur Shyam samjhate hain missing values ka ilaaj, duplicates, inconsistent data, aur outlier detection IQR, 3-sigma, LOF aur Isolation Forest se.',
          noIndex: false,
        },
        createdBy: SEED_ACTOR,
        updatedBy: SEED_ACTOR,
      },
      $setOnInsert: { createdAt: now, revision: 1 },
      $currentDate: { updatedAt: true },
    },
    { upsert: true, returnDocument: 'after' },
  );

  console.warn('Seed complete:');
  console.warn(`  series:    /series/${seriesSlug}`);
  console.warn(`  module:    /series/${seriesSlug}/module/${moduleSlug}`);
  console.warn(`  episode 1: /episodes/${episodeSlug}`);
  console.warn(`  episode 2: /episodes/${episode2Slug}`);
  console.warn(`  episode 3: /episodes/${episode3Slug} (audio not attached yet)`);
  console.warn(`  episode 4: /episodes/${episode4Slug}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
