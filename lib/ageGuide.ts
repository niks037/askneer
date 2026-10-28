// Age-by-age guide: what parents commonly see, in plain language.
// Not medical advice. Every child develops at their own pace.

export interface AgePhase {
  id: string
  from: number // months, inclusive
  to: number // months, inclusive
  label: string // e.g. "15–17 months"
  emoji: string
  title: string
  tagline: string
  seeing: string[] // what you may be seeing
  why: string // why it happens
  helps: string[] // what tends to help
  tryToday: string // one small thing to do today
}

export const MAX_MONTHS = 36

export const AGE_PHASES: AgePhase[] = [
  {
    id: 'newborn',
    from: 0,
    to: 1,
    label: '0–1 months',
    emoji: '🌱',
    title: 'The big adjustment',
    tagline: 'Everything is new for both of you.',
    seeing: [
      'Sleeping in short stretches, day and night',
      'Feeding very often',
      'Fussier or more unsettled in the evenings',
    ],
    why: 'Your baby has just left a warm, dark, constantly fed world. Sleep, hunger and comfort are all still being worked out, and that takes time.',
    helps: [
      'Hold, rock and carry your baby as much as you like. You cannot spoil a newborn.',
      'Keep the room calm and dim in the evening, and keep noise low.',
      'Write feeds and sleeps in one place so you can see the pattern, even a rough one.',
    ],
    tryToday:
      'Hold your baby close and talk softly during a feed. Newborns look closely at faces at close range, so let them study yours.',
  },
  {
    id: 'settling',
    from: 2,
    to: 3,
    label: '2–3 months',
    emoji: '😊',
    title: 'First smiles and cooing',
    tagline: 'Your baby starts to answer you back.',
    seeing: [
      'Social smiles and the first coos',
      'Longer wake-ups, and more interest in faces and sounds',
      'Crying that can be strong in the early evening',
    ],
    why: 'Eyesight and the brain are developing quickly, so your baby can now notice and respond to you. Evenings are often the hardest part of the day because the day has been a lot to take in.',
    helps: [
      'Respond to coos with your own sounds and pause to let your baby answer.',
      'Short, supervised tummy time on your chest or the floor, a few times a day.',
      'A simple wind-down: dim lights, quiet voice, same few steps each evening.',
    ],
    tryToday:
      'Hold your face about 20–30 cm from your baby, smile and wait. Count how long they hold your gaze.',
  },
  {
    id: 'discover',
    from: 4,
    to: 5,
    label: '4–5 months',
    emoji: '🖐️',
    title: 'Discovering hands and voice',
    tagline: 'Everything goes to the mouth.',
    seeing: [
      'Reaching for and grabbing toys, hands in the mouth',
      'Laughing, squealing and trying out sounds',
      'Sleep that suddenly changes, with more waking',
    ],
    why: 'Your baby is learning that their hands belong to them and can move things. Sleep patterns often shift around now as the brain matures, and it usually settles again.',
    helps: [
      'Offer safe toys to grab, shake and mouth, and keep small objects out of reach.',
      'Keep bedtime steps the same every night, even when sleep is bumpy.',
      'Play on the floor with space to wriggle, roll and kick.',
    ],
    tryToday:
      'Hold a soft toy just within reach and let your baby work out how to get it. Cheer when they do.',
  },
  {
    id: 'sitting',
    from: 6,
    to: 8,
    label: '6–8 months',
    emoji: '🪑',
    title: 'Sitting up and exploring',
    tagline: 'New views, new tastes, new sounds.',
    seeing: [
      'Sitting with or without support, and starting to scoot or crawl',
      'Babbling such as "ba-ba" and "ma-ma"',
      'Curiosity about food, and noticing strangers',
    ],
    why: 'Being upright changes how your baby sees the world, and their hands and mouth are busy learning how things work. Babbling is practice for real words.',
    helps: [
      'Babble back and name the things your baby looks at.',
      'Let them practise sitting and reaching on a safe floor with plenty of space.',
      'Ask your child’s doctor when and how to start solids. Every baby is different.',
    ],
    tryToday:
      'Sit on the floor facing your baby with two toys. Name each one as they look at it, and see which they choose.',
  },
  {
    id: 'clingy',
    from: 9,
    to: 11,
    label: '9–11 months',
    emoji: '🤗',
    title: 'Clingy and crawling',
    tagline: 'They want you, and only you.',
    seeing: [
      'Crying or clinging when you leave the room',
      'Crawling, pulling up to stand and cruising along furniture',
      'Loving peek-a-boo and dropping things to see what happens',
    ],
    why: 'Your baby now understands that you still exist when you are out of sight, but does not yet know you will come back. That is why goodbyes feel so big.',
    helps: [
      'Say a short, calm goodbye every time. Do not sneak away.',
      'Play peek-a-boo and hide-and-find games. They teach "gone and back".',
      'Make the floor safe for exploring: cover sockets, secure furniture, clear small objects.',
    ],
    tryToday:
      'Play peek-a-boo with a cloth, and let them pull it off. Every reveal teaches that you always come back.',
  },
  {
    id: 'walking',
    from: 12,
    to: 14,
    label: '12–14 months',
    emoji: '👣',
    title: 'First steps, first words',
    tagline: 'Wobbly, proud and always on the move.',
    seeing: [
      'Pulling up, cruising and taking first steps, with lots of falls',
      'A few clear words and lots of pointing',
      'Strong likes and dislikes, including about food',
    ],
    why: 'Walking and talking both start now, and they use up a lot of energy. Pointing is your toddler’s way of sharing what they notice with you.',
    helps: [
      'Name what they point at: "Yes, a dog!"',
      'Let them practise walking on soft, safe surfaces and go barefoot indoors when you can.',
      'Offer food choices without pressure and keep mealtimes calm.',
    ],
    tryToday:
      'Go on a short "pointing walk". Every time your toddler points, say the name of the thing.',
  },
  {
    id: 'feelings',
    from: 15,
    to: 17,
    label: '15–17 months',
    emoji: '🌪️',
    title: 'Big feelings, small words',
    tagline: 'They know what they want and cannot say it yet.',
    seeing: [
      'The first tantrums, often when tired, hungry or frustrated',
      'Saying "no" and wanting to do things alone',
      'Copying what you do, such as talking on a phone or stirring a pot',
    ],
    why: 'Your toddler has strong wants and very few words. The gap between the two is frustrating, and tantrums are how that feeling comes out.',
    helps: [
      'Name the feeling in a few words: "You’re cross. You wanted that."',
      'Stay calm and close, and wait for the storm to pass before you talk.',
      'Offer two choices you are happy with, such as "red cup or blue cup?"',
    ],
    tryToday:
      'Next time your toddler gets frustrated, say what they feel in one short sentence and stay next to them.',
  },
  {
    id: 'mine',
    from: 18,
    to: 23,
    label: '18–23 months',
    emoji: '🙋',
    title: 'The "mine!" stage',
    tagline: 'Independence arrives with a lot of noise.',
    seeing: [
      'Saying "mine!" and "no!", and testing limits',
      'A fast-growing vocabulary and the first two-word phrases',
      'Running, climbing and wanting to do everything themselves',
    ],
    why: 'Your toddler is discovering they are a separate person with their own wishes. Testing your limits is how they learn where the edges are.',
    helps: [
      'Keep a few firm, consistent rules and be kind when you hold them.',
      'Give small jobs to let them feel capable, such as carrying a spoon or putting a sock in the basket.',
      'Read the same books again and again. Repetition builds language.',
    ],
    tryToday:
      'Give your toddler one small real job today, and thank them for it by name.',
  },
  {
    id: 'two',
    from: 24,
    to: 29,
    label: '24–29 months',
    emoji: '🧒',
    title: 'Two and very sure',
    tagline: '"I do it myself!"',
    seeing: [
      'Wanting to do everything alone, even when it takes forever',
      'Short sentences and plenty of new words every week',
      'Big feelings, strong routines and interest in the potty',
    ],
    why: 'Independence, language and emotions are all growing at once, and your child has not yet learned to manage them. Routines help because they make the day predictable.',
    helps: [
      'Build in extra time so "I do it myself" does not become a battle.',
      'Keep daily routines steady for meals, naps, baths and bedtime.',
      'Watch for signs of potty interest, and follow your child’s lead without pressure.',
    ],
    tryToday:
      'Pick one daily task, such as putting on shoes, and let your child do it alone while you wait without helping.',
  },
  {
    id: 'why',
    from: 30,
    to: 36,
    label: '30–36 months',
    emoji: '🎭',
    title: 'Questions and pretend play',
    tagline: '"Why?" is the new favourite word.',
    seeing: [
      'Endless questions, and pretend games with toys or people',
      'More interest in other children, and early sharing and turn-taking',
      'Bedtime battles and big moods when tired',
    ],
    why: 'Your child’s imagination and language are taking off. Asking why is how they learn how the world works, and pretend play is how they practise real life.',
    helps: [
      'Answer simply, and turn the question back: "What do you think?"',
      'Join their pretend play and let them lead the story.',
      'Keep bedtime short and predictable, with the same few steps every night.',
    ],
    tryToday:
      'Play a pretend game today, such as a tea party or doctor, and let your child decide what happens next.',
  },
]

export function getPhaseForMonths(months: number): AgePhase {
  const m = Math.max(0, Math.min(MAX_MONTHS, Math.floor(months)))
  return AGE_PHASES.find(p => m >= p.from && m <= p.to) ?? AGE_PHASES[0]
}

export function getNextPhase(phase: AgePhase): AgePhase | null {
  const i = AGE_PHASES.findIndex(p => p.id === phase.id)
  return i >= 0 && i < AGE_PHASES.length - 1 ? AGE_PHASES[i + 1] : null
}

export function formatAge(months: number): string {
  const m = Math.max(0, Math.min(MAX_MONTHS, Math.floor(months)))
  if (m < 24) return `${m} month${m === 1 ? '' : 's'}`
  const y = Math.floor(m / 12)
  const rem = m % 12
  return rem === 0 ? `${y} years` : `${y} years ${rem} month${rem === 1 ? '' : 's'}`
}
