import 'dotenv/config';
import { getDb } from '@/lib/db/mongodb';
import { COLLECTIONS } from '@/lib/db/collections';
import { toSlug } from '@/lib/utilities/slug';
import { calculateReadingTime } from '@/lib/utilities/reading-time';
import { contentBlocksSchema, type ContentBlock } from '@/models/content-block.model';
import type { SeriesDocument } from '@/models/series.model';
import type { ModuleDocument } from '@/models/module.model';
import type { EpisodeDocument } from '@/models/episode.model';
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
        featured: true,
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

  console.warn('Seed complete:');
  console.warn(`  series:    /series/${seriesSlug}`);
  console.warn(`  module:    /series/${seriesSlug}/module/${moduleSlug}`);
  console.warn(`  episode 1: /episodes/${episodeSlug}`);
  console.warn(`  episode 2: /episodes/${episode2Slug}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
