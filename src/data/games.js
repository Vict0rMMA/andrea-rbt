// Content for the mini-games. All original.

export const FUNCTIONS = ['Attention', 'Escape', 'Tangible', 'Automatic'];

// Function Frenzy: what is the function?
export const FRENZY = [
  ['Screams until mom looks up from her phone and talks to him.', 'Attention'],
  ['Throws the worksheet and the teacher removes it.', 'Escape'],
  ['Cries in the store until dad buys candy.', 'Tangible'],
  ['Flaps his hands alone in his room, no one around.', 'Automatic'],
  ['Hits a peer, and the teacher comes over to talk to him.', 'Attention'],
  ['Runs away when it is time to brush teeth, and brushing is skipped.', 'Escape'],
  ['Grabs the iPad from her brother and keeps it.', 'Tangible'],
  ['Hums and rocks the same way in every setting, even alone.', 'Automatic'],
  ['Says bad words; everyone laughs.', 'Attention'],
  ['Pretends to be sick at math time and goes to the nurse.', 'Escape'],
  ['Bites his hand when the toy car is taken away, and gets it back.', 'Tangible'],
  ['Picks at his skin while watching TV alone.', 'Automatic'],
  ['Calls out in class; the teacher says "please wait your turn."', 'Attention'],
  ['Falls to the floor when asked to clean up; mom cleans up for him.', 'Escape'],
  ['Kicks the table until she gets the snack.', 'Tangible'],
  ['Spins in circles because it feels good.', 'Automatic'],
  ['Tells on her sister all day; mom stops and listens each time.', 'Attention'],
  ['Puts his head down when the hard book comes out; the book goes away.', 'Escape'],
  ['Yells "mine!" until he gets the red crayon.', 'Tangible'],
  ['Mouths every toy, alone or with people.', 'Automatic'],
  ['Pinches the RBT when she talks to another child; RBT turns back to him.', 'Attention'],
  ['Elopes from the table during work and work stops.', 'Escape'],
  ['Screams when the tablet timer ends; gets 5 more minutes.', 'Tangible'],
  ['Flicks fingers in front of his eyes at the window light.', 'Automatic'],
];

// Reinforce or Punish? (behavior goes up = reinforcement, down = punishment)
export const RP = [
  ['Sam gets a sticker after cleaning up. He cleans up more.', 'Reinforcement'],
  ['Lia loses a token for hitting. Hitting goes down.', 'Punishment'],
  ['Max asks for a break; the hard task is removed. He asks more.', 'Reinforcement'],
  ['Ana must clean the whole table after spilling on purpose. Spilling goes down.', 'Punishment'],
  ['Teo gets praise for saying "hi." He says "hi" more.', 'Reinforcement'],
  ['Zoe loses tablet time for throwing. Throwing goes down.', 'Punishment'],
  ['Mom stops nagging when Leo starts homework. He starts homework faster.', 'Reinforcement'],
  ['Eli gets a reprimand after running. Running goes down.', 'Punishment'],
  ['Mia\'s seatbelt beep stops when she buckles up. She buckles faster.', 'Reinforcement'],
  ['Noah leaves the fun game for 2 minutes after biting. Biting goes down.', 'Punishment'],
  ['Ava gets a high five for sharing. She shares more.', 'Reinforcement'],
  ['Ben\'s phone is taken after cursing. Cursing goes down.', 'Punishment'],
  ['Kai wears headphones and the loud noise stops. He wears them more.', 'Reinforcement'],
  ['Lily gets extra chores after lying. Lying goes down.', 'Punishment'],
  ['Jon gets tokens for working. He works more.', 'Reinforcement'],
  ['Sara\'s favorite toy is put away after she hits. Hitting goes down.', 'Punishment'],
];

export const PROMPTS_LEAST_TO_MOST = ['Gestural', 'Verbal', 'Model', 'Partial physical', 'Full physical'];

export const TASKS = [
  { name: 'Washing hands', steps: ['Turn on water', 'Wet hands', 'Get soap', 'Rub hands for 20 seconds', 'Rinse hands', 'Turn off water', 'Dry hands'] },
  { name: 'Brushing teeth', steps: ['Pick up toothbrush', 'Put toothpaste on brush', 'Brush top teeth', 'Brush bottom teeth', 'Spit', 'Rinse brush'] },
  { name: 'Putting on a jacket', steps: ['Pick up jacket', 'Put one arm in', 'Put other arm in', 'Connect the zipper', 'Pull zipper up'] },
];

// Spot the bad session note: [objective, subjective]
export const NOTES = [
  ['Client cried for 4 minutes after the tablet was removed.', 'Client was in a bad mood and acted spoiled.'],
  ['Client completed 8 of 10 puzzle trials independently.', 'Client did great and seemed really happy today.'],
  ['Client hit the RBT 3 times during table work (2:10–2:25 p.m.).', 'Client was aggressive because he was frustrated.'],
  ['Client said "break please" 5 times and received a 1-minute break each time.', 'Client was lazy and tried to avoid work all day.'],
  ['Mom reported the client slept 4 hours last night.', 'Client was tired and cranky because of his parents.'],
  ['Client left the table 6 times; each time the RBT prompted return within 10 seconds.', 'Client just did not want to be there.'],
  ['Client threw 2 blocks at the wall at 3:05 p.m.', 'Client had a meltdown and was out of control.'],
  ['Client manded for juice 7 times using a 2-word phrase.', 'Client was very chatty and sweet today.'],
];

// Ethics swipe: should the RBT do it?
export const ETHICS_SWIPE = [
  ['Accept a $20 gift card from a parent at Christmas.', false, 'RBTs don\'t accept gifts from clients or families.'],
  ['Tell the BCBA that the client started a new medication.', true, 'Changes that may affect behavior get reported.'],
  ['Post a cute photo of your client\'s drawing, no name.', false, 'Never post about clients, even without names.'],
  ['Ask your BCBA before running a program you don\'t understand.', true, 'When in doubt, ask your supervisor.'],
  ['Change the reinforcement schedule because the plan "isn\'t working."', false, 'Only the BCBA changes the plan. Report the data.'],
  ['Babysit your client on Saturday for extra cash.', false, 'That is a multiple relationship.'],
  ['Write "cried for 5 minutes" instead of "was upset."', true, 'Objective notes describe what you saw.'],
  ['Keep working when your only supervisor quits and no one replaces them.', false, 'No supervisor means no RBT services.'],
  ['Report suspected abuse even without proof.', true, 'Reasonable suspicion is enough to report.'],
  ['Accept a parent\'s friend request on Instagram.', false, 'Social media connections create a dual relationship.'],
  ['Kindly decline homemade lunch from the client\'s mom.', true, 'Food is a gift too. Decline kindly.'],
  ['Ask for training before doing a procedure you never learned.', true, 'Only do what you are trained to do.'],
  ['Talk about your client\'s progress with your sister.', false, 'Confidentiality: share only with the team.'],
  ['Sign for a session that didn\'t happen because your boss asked.', false, 'That is fraud. Refuse and report.'],
  ['Report your arrest to the BACB within 30 days.', true, 'Self-reporting is required by the RBT Ethics Code.'],
  ['Respect a family\'s culture and tell the BCBA if it affects the plan.', true, 'Respect first, then let the BCBA adjust.'],
];

// Measure It!: scenarios shown as an animated timeline.
// kind: what the animation shows; answer: the best measurement.
export const MEASURE = [
  { text: 'The BCBA wants to know HOW MANY times Ella raises her hand.', kind: 'blips', answer: 'Frequency' },
  { text: 'The BCBA wants to know HOW LONG each of Leo\'s tantrums lasts.', kind: 'bars', answer: 'Duration' },
  { text: 'The RBT says "Clean up." How long until Sam STARTS?', kind: 'delay', answer: 'Latency' },
  { text: 'Kai eats too fast. How much time is BETWEEN bites?', kind: 'gaps', answer: 'IRT' },
  { text: 'Count each time Mia says "help" during snack.', kind: 'blips', answer: 'Frequency' },
  { text: 'Time how long Ben stays seated during circle.', kind: 'bars', answer: 'Duration' },
  { text: 'You call Ava\'s name. How fast does she look at you?', kind: 'delay', answer: 'Latency' },
  { text: 'How much time passes between one question and the next one Noah asks?', kind: 'gaps', answer: 'IRT' },
];
export const MEASURES = ['Frequency', 'Duration', 'Latency', 'IRT'];
