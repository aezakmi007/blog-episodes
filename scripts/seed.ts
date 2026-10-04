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

async function seed(): Promise<void> {
  const parsed = contentBlocksSchema.safeParse(contentBlocks);
  if (!parsed.success) {
    console.error('Seed content blocks failed validation:');
    console.error(parsed.error.format());
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
        publishedAt: now,
        featured: true,
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

  console.warn('Seed complete:');
  console.warn(`  series:  /series/${seriesSlug}`);
  console.warn(`  module:  /series/${seriesSlug}/module/${moduleSlug}`);
  console.warn(`  episode: /episodes/${episodeSlug}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
