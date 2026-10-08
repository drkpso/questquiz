/* ============================================================
   QuestQuiz — content banks
   Fact banks + computational question families, by grade band.
   Bands: k2 (K-2), e35 (3-5), m68 (6-8), h912 (9-12)
   ============================================================ */

/* ---------- tiny helpers shared with engine ---------- */
function _int(r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); }
function _pick(r, a) { return a[Math.floor(r() * a.length)]; }
function _shuf(r, a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function _uniqNum(r, correct, n, spread, round) {
  const out = [correct], guard = 200;
  let g = 0;
  while (out.length < n && g++ < guard) {
    let d = correct + (r() < 0.5 ? -1 : 1) * _int(r, 1, Math.max(1, spread));
    if (round === 'int') d = Math.round(d);
    else if (round === '2dp') d = Math.round(d * 100) / 100;
    if (!out.some(v => Math.abs(v - d) < 1e-9)) out.push(d);
  }
  while (out.length < n) out.push(correct + out.length * 3);
  return out;
}

/* ---------- fact bank registry ----------
   q  : forward prompt template, {a} given -> answer is b
   rv : reverse prompt template, {b} given -> answer is a
   tf : statement template for the true/false form
   items: "a=b|a=b|..."
------------------------------------------ */
const BANKS = {};
function B(id, q, rv, tf, items) {
  BANKS[id] = {
    id, q, rv, tf,
    items: items.split('|').map(s => { const p = s.split('='); return { a: p[0].trim(), b: p[1].trim() }; })
  };
}

/* ===================== SCIENCE ===================== */
B('sci.k2.group', 'Which animal group does the {a} belong to?', 'Which of these animals is {b_l}?', 'A {a} is {b_l}.',
  'frog=an amphibian|eagle=a bird|shark=a fish|cow=a mammal|snake=a reptile|owl=a bird|salamander=an amphibian|dolphin=a mammal|turtle=a reptile|goldfish=a fish|bat=a mammal|penguin=a bird|crocodile=a reptile|toad=an amphibian|tuna=a fish|kangaroo=a mammal|parrot=a bird|lizard=a reptile|newt=an amphibian|salmon=a fish');

B('sci.k2.sense', 'Which body part do you use to {a}?', 'What do you use your {b_l} for?', 'You {a} with your {b_l}.',
  'see colours=eyes|hear music=ears|smell flowers=nose|taste food=tongue|feel if something is soft=skin|see in the dark with a torch=eyes|hear a bell ring=ears|smell fresh bread=nose');

B('sci.k2.weather', 'What is the weather like when {a}?', 'When is the weather {b_l}?', 'When {a}, the weather is {b_l}.',
  'water drops fall from clouds=rainy|white flakes fall and it is cold=snowy|the sky is grey and covered=cloudy|the air moves fast and pushes trees=windy|the sun shines with no clouds=sunny|there is thunder and lightning=stormy|a thick mist sits low=foggy');

B('sci.k2.plantpart', 'Which part of a plant {a}?', 'What does the {b_l} of a plant do?', 'The {b_l} of a plant {a}.',
  'takes in water from the soil=root|holds the plant up=stem|makes food using sunlight=leaf|becomes a fruit after pollination=flower|carries the seeds=fruit');

B('sci.k2.living', 'Is a {a} living or non-living?', 'Which of these is {b_l}?', 'A {a} is {b_l}.',
  'oak tree=living|rock=non-living|butterfly=living|plastic spoon=non-living|mushroom=living|cloud=non-living|earthworm=living|pencil=non-living|grass=living|toy car=non-living');

B('sci.e35.matter', 'What state of matter is {a} at room temperature?', 'Which of these is {b_l} at room temperature?', 'At room temperature, {a} is {b_l}.',
  'liquid water=a liquid|ice=a solid|steam=a gas|oxygen=a gas|a copper coin=a solid|milk=a liquid|helium in a balloon=a gas|a wooden block=a solid|cooking oil=a liquid|carbon dioxide=a gas');

B('sci.e35.planet', 'Which planet is {a}?', 'What is special about {b}?', '{b} is {a}.',
  'closest to the Sun=Mercury|the largest in our solar system=Jupiter|known as the Red Planet=Mars|famous for its bright rings=Saturn|the planet we live on=Earth|the hottest planet=Venus|the farthest from the Sun=Neptune|tipped on its side as it orbits=Uranus');

B('sci.e35.machine', 'Which simple machine {a}?', 'What does a {b_l} do?', 'A {b_l} {a}.',
  'is a slanted surface used to raise a load=an inclined plane|turns around a fixed point to lift a load=a lever|is a rope running over a grooved wheel=a pulley|is an inclined plane wrapped around a rod=a screw|splits things apart with a sharp edge=a wedge|is a round part turning on an axle=a wheel and axle');

B('sci.e35.lifecycle', 'What comes right after the {a} stage in a butterfly\'s life cycle?', 'Which stage comes just before {b_l}?', 'After the {a} stage comes {b_l}.',
  'egg=the larva (caterpillar)|larva (caterpillar)=the pupa (chrysalis)|pupa (chrysalis)=the adult butterfly');

B('sci.e35.watercycle', 'What is the process where {a}?', 'What happens during {b_l}?', 'When {a}, this is called {b_l}.',
  'liquid water turns into water vapour=evaporation|water vapour cools and turns back into droplets=condensation|water falls from clouds as rain or snow=precipitation|water soaks down into the ground=infiltration|plants release water vapour from their leaves=transpiration');

B('sci.e35.foodchain', 'What do we call an organism that {a}?', 'What does a {b_l} do?', 'An organism that {a} is called {b_l}.',
  'makes its own food using sunlight=a producer|eats only plants=a herbivore|eats only other animals=a carnivore|eats both plants and animals=an omnivore|breaks down dead material=a decomposer|hunts and eats other animals=a predator|is hunted and eaten=prey');

B('sci.m68.organelle', 'Which cell part {a}?', 'What is the job of the {b_l}?', 'The {b_l} {a}.',
  'controls the cell and holds the DNA=nucleus|releases energy from food=mitochondrion|makes proteins=ribosome|controls what enters and leaves the cell=cell membrane|gives plant cells a rigid shape=cell wall|captures sunlight for photosynthesis=chloroplast|stores water in plant cells=vacuole|packages and ships proteins=Golgi apparatus');

B('sci.m68.symbol', 'What is the chemical symbol for {a}?', 'Which element has the symbol {b}?', 'The symbol for {a} is {b}.',
  'oxygen=O|sodium=Na|potassium=K|iron=Fe|gold=Au|silver=Ag|copper=Cu|lead=Pb|hydrogen=H|helium=He|carbon=C|nitrogen=N|calcium=Ca|zinc=Zn|tin=Sn|mercury=Hg|chlorine=Cl|sulfur=S|magnesium=Mg|aluminium=Al');

B('sci.m68.body', 'Which body system {a}?', 'What does the {b_l} do?', 'The {b_l} {a}.',
  'moves blood around the body=circulatory system|takes in oxygen and removes carbon dioxide=respiratory system|breaks food down into nutrients=digestive system|carries signals from the brain=nervous system|supports the body and protects organs=skeletal system|filters waste out of the blood=excretory system|defends the body against infection=immune system|releases hormones=endocrine system');

B('sci.m68.energy', 'What form of energy is {a}?', 'Which of these is {b_l}?', '{a} is {b_l}.',
  'energy stored in a stretched spring=elastic potential energy|energy of a moving bicycle=kinetic energy|energy stored in food and fuel=chemical energy|energy carried by sunlight=radiant energy|energy in a hot cup of tea=thermal energy|energy flowing through a wire=electrical energy|energy released by splitting an atom=nuclear energy|energy carried by a vibrating drum skin=sound energy');

B('sci.m68.newton', 'Which of Newton\'s laws says that {a}?', 'What does Newton\'s {b_l} state?', 'Newton\'s {b_l} says that {a}.',
  'an object stays at rest or in steady motion unless a force acts on it=first law|force equals mass times acceleration=second law|every action has an equal and opposite reaction=third law');

B('sci.h912.chem', 'In chemistry, what is {a}?', 'How is {b_l} defined?', '{b} is {a}.',
  'the number of particles in one mole (6.022 x 10^23)=Avogadro\'s number|a bond formed by sharing electrons=a covalent bond|a bond formed by transferring electrons=an ionic bond|a substance that donates protons in solution=an acid|a substance that accepts protons in solution=a base|a measure of hydrogen ion concentration=pH|a reaction that releases heat=an exothermic reaction|a reaction that absorbs heat=an endothermic reaction|a substance that speeds a reaction without being used up=a catalyst');

B('sci.h912.bio', 'In biology, what is {a}?', 'What does {b_l} mean?', '{b} is {a}.',
  'the division of a body cell into two identical cells=mitosis|the division that makes gametes with half the chromosomes=meiosis|the observable characteristics of an organism=the phenotype|the genetic make-up of an organism=the genotype|a protein that speeds up a biological reaction=an enzyme|the process plants use to make glucose from light=photosynthesis|the release of energy from glucose using oxygen=aerobic respiration|a change in DNA sequence=a mutation|the movement of water across a membrane=osmosis');

B('sci.h912.phys', 'In physics, which quantity is measured in {a}?', 'What unit is {b_l} measured in?', '{b} is measured in {a}.',
  'newtons=force|joules=energy|watts=power|pascals=pressure|hertz=frequency|coulombs=electric charge|volts=potential difference|ohms=resistance|amperes=electric current|teslas=magnetic flux density');

B('sci.h912.earth', 'In earth science, what is {a}?', 'What does {b_l} refer to?', '{b} is {a}.',
  'the slow movement of Earth\'s crustal plates=plate tectonics|molten rock beneath the surface=magma|molten rock that has reached the surface=lava|the boundary where two plates slide past each other=a transform fault|rock formed from cooled magma=igneous rock|rock formed from compressed sediment=sedimentary rock|rock changed by heat and pressure=metamorphic rock|the layer of Earth we live on=the crust');

/* ===================== ELA ===================== */
B('ela.k2.rhyme', 'Which word rhymes with "{a}"?', 'Which word rhymes with "{b}"?', '"{a}" rhymes with "{b}".',
  'cat=hat|dog=log|bee=tree|sun=fun|cake=lake|star=car|bell=shell|frog=jog|moon=spoon|nose=rose|chair=bear|clock=sock|light=night|band=hand|goat=boat');

B('ela.k2.opposite', 'What is the opposite of "{a}"?', 'What is the opposite of "{b}"?', 'The opposite of "{a}" is "{b}".',
  'hot=cold|big=small|up=down|fast=slow|happy=sad|day=night|open=shut|hard=soft|full=empty|old=new|wet=dry|loud=quiet|near=far|light=heavy|first=last');

B('ela.k2.plural', 'What is the plural of "{a}"?', 'What is the singular of "{b}"?', 'The plural of "{a}" is "{b}".',
  'box=boxes|child=children|mouse=mice|foot=feet|tooth=teeth|leaf=leaves|baby=babies|bus=buses|knife=knives|man=men|goose=geese|church=churches|wolf=wolves|city=cities|sheep=sheep');

B('ela.k2.sound', 'What letter does "{a}" begin with?', 'Which word begins with the letter {b}?', '"{a}" begins with the letter {b}.',
  'apple=A|balloon=B|candle=C|drum=D|elephant=E|feather=F|garden=G|hammer=H|island=I|jungle=J|kitten=K|lantern=L|monkey=M|nest=N|orange=O');

B('ela.e35.synonym', 'Which word means almost the same as "{a}"?', 'Which word means almost the same as "{b}"?', '"{a}" and "{b}" mean nearly the same thing.',
  'happy=joyful|angry=furious|big=enormous|tired=weary|smart=clever|quick=rapid|brave=courageous|quiet=silent|strange=peculiar|begin=commence|help=assist|show=reveal|tiny=minuscule|rich=wealthy|calm=serene');

B('ela.e35.antonym', 'Which word means the opposite of "{a}"?', 'Which word means the opposite of "{b}"?', '"{a}" is the opposite of "{b}".',
  'ancient=modern|generous=selfish|expand=shrink|arrive=depart|praise=criticise|gather=scatter|permit=forbid|victory=defeat|increase=decrease|simple=complicated|attract=repel|rigid=flexible|sharp=blunt|vacant=occupied');

B('ela.e35.prefix', 'What does the prefix "{a}" mean?', 'Which prefix means "{b_l}"?', 'The prefix "{a}" means {b_l}.',
  're-=again|un-=not|pre-=before|sub-=under|mis-=wrongly|tri-=three|bi-=two|over-=too much|inter-=between|trans-=across|semi-=half|anti-=against');

B('ela.e35.pos', 'What part of speech is the word "{a}" in "The {a_ctx}"?', 'Which word is {b_l}?', '"{a}" is {b_l}.',
  'quickly=an adverb|beautiful=an adjective|running=a verb|kindness=a noun|they=a pronoun|under=a preposition|and=a conjunction|loudly=an adverb|ancient=an adjective|river=a noun');

B('ela.e35.homophone', 'Which word completes the sentence: "{a}"?', 'Which sentence needs the word "{b}"?', 'The sentence "{a}" takes the word "{b}".',
  'I ate ___ apples for lunch=two|That slice is ___ big for me=too|We are walking ___ the park=to|The dog chased ___ tail=its|___ raining again=It\'s|___ books are on the shelf=Their|Put the bag over ___=there|___ arriving at six=They\'re|She writes better ___ I do=than|We will meet you ___ noon=at|He could not ___ the answer=hear|Come over ___ and sit down=here');

B('ela.m68.figurative', 'Which figure of speech is "{a}"?', 'Which of these is {b_l}?', '"{a}" is {b_l}.',
  'The stars danced in the sky=personification|Her smile was as bright as the sun=a simile|Time is a thief=a metaphor|I have told you a million times=hyperbole|The bees buzzed busily=alliteration|The clock ticked and tocked=onomatopoeia|He was a walking dictionary=a metaphor|The wind whispered secrets=personification|As stubborn as a mule=a simile|Peter picked purple plums=alliteration');

B('ela.m68.confuse', 'Which word fits: "{a}"?', 'Which sentence needs the word "{b}"?', '"{a}" takes the word "{b}".',
  'The dog wagged ___ tail=its|___ going to rain later=It\'s|They left ___ coats here=their|Put the books over ___=there|___ coming to the party=They\'re|You did better ___ me=than|We will leave ___ noon=at');

B('ela.m68.root', 'What does the root "{a}" mean?', 'Which root means "{b_l}"?', 'The root "{a}" means {b_l}.',
  'aqua=water|bio=life|geo=earth|chrono=time|phon=sound|scrib=write|port=carry|dict=speak|spect=look|therm=heat|photo=light|graph=write|vis=see|audi=hear|struct=build');

B('ela.m68.vocab', 'What does "{a}" mean?', 'Which word means "{b_l}"?', '"{a}" means {b_l}.',
  'meticulous=extremely careful about detail|obsolete=no longer in use|candid=honest and direct|resilient=able to recover quickly|ambiguous=open to more than one meaning|tedious=long and tiring|diligent=hardworking and careful|frugal=careful with money|eloquent=speaking fluently and persuasively|reluctant=unwilling and hesitant|arduous=needing a lot of effort|lucid=clear and easy to understand');

B('ela.h912.device', 'Which rhetorical or literary device is "{a}"?', 'Which of these is {b_l}?', '"{a}" is {b_l}.',
  'Ask not what your country can do for you, ask what you can do for your country=antithesis|We shall fight on the beaches, we shall fight on the landing grounds=anaphora|The pen is mightier than the sword=metonymy|All hands on deck=synecdoche|Deafening silence=an oxymoron|It is a truth universally acknowledged=an aphorism|Calling a disaster "a slight inconvenience"=understatement|Referring to a traitor as an honourable man=verbal irony|A rose standing for love=symbolism|Three words, three beats, three hammer blows=tricolon');

B('ela.h912.vocab', 'What does "{a}" mean?', 'Which word means "{b_l}"?', '"{a}" means {b_l}.',
  'ubiquitous=present everywhere|ephemeral=lasting a very short time|pragmatic=dealing with things practically|innocuous=harmless|equivocate=to speak vaguely to avoid commitment|magnanimous=generous towards a rival|obfuscate=to make deliberately unclear|intransigent=refusing to compromise|perfunctory=done without real care|sanguine=cheerfully optimistic|laconic=using very few words|venerate=to regard with deep respect|austere=severe and without comfort|circumspect=cautious and watchful');

B('ela.h912.grammar', 'What is the error in "{a}"?', 'Which sentence contains {b_l}?', '"{a}" contains {b_l}.',
  'Running down the street, the bus was missed by Sara=a dangling modifier|Each of the students have finished=a subject-verb agreement error|She likes swimming, hiking, and to cycle=faulty parallel structure|The team celebrated their victory; they were exhausted, it was a long season=a comma splice|Neither the coach nor the players was ready=a subject-verb agreement error|He only ate three biscuits, not four=a misplaced modifier');

/* ===================== LANGUAGE (world languages) ===================== */
B('lang.k2.escolour', 'What is the Spanish word for the colour {a}?', 'What colour is "{b}" in English?', 'In Spanish, {a} is "{b}".',
  'red=rojo|blue=azul|green=verde|yellow=amarillo|black=negro|white=blanco|orange=naranja|purple=morado|pink=rosa|brown=marrón');

B('lang.k2.esnum', 'What is the Spanish word for {a}?', 'Which number is "{b}" in Spanish?', 'In Spanish, {a} is "{b}".',
  'one=uno|two=dos|three=tres|four=cuatro|five=cinco|six=seis|seven=siete|eight=ocho|nine=nueve|ten=diez');

B('lang.k2.frgreet', 'How do you say "{a}" in French?', 'What does "{b}" mean in English?', 'In French, "{a}" is "{b}".',
  'hello=bonjour|goodbye=au revoir|thank you=merci|please=s\'il vous plaît|yes=oui|no=non|good evening=bonsoir|good night=bonne nuit');

B('lang.e35.esfamily', 'What is the Spanish word for "{a}"?', 'What does "{b}" mean?', 'In Spanish, "{a}" is "{b}".',
  'mother=la madre|father=el padre|sister=la hermana|brother=el hermano|grandmother=la abuela|grandfather=el abuelo|daughter=la hija|son=el hijo|aunt=la tía|uncle=el tío');

B('lang.e35.esday', 'What is the Spanish word for {a}?', 'Which day is "{b}"?', 'In Spanish, {a} is "{b}".',
  'Monday=lunes|Tuesday=martes|Wednesday=miércoles|Thursday=jueves|Friday=viernes|Saturday=sábado|Sunday=domingo');

B('lang.e35.frfood', 'What is the French word for "{a}"?', 'What does "{b}" mean in English?', 'In French, "{a}" is "{b}".',
  'bread=le pain|water=l\'eau|cheese=le fromage|apple=la pomme|milk=le lait|egg=l\'œuf|chicken=le poulet|rice=le riz|fish=le poisson|butter=le beurre');

B('lang.m68.esverb', 'Which Spanish verb form is correct: "{a}"?', 'Where would "{b}" be used?', '"{a}" takes the form "{b}".',
  'Yo ___ estudiante=soy|Ella ___ cansada hoy=está|Nosotros ___ en Madrid=estamos|Ellos ___ mis amigos=son|Tú ___ muy alto=eres|El libro ___ sobre la mesa=está');

B('lang.m68.esgender', 'Which article goes with "{a}"?', 'Which noun takes "{b}"?', '"{a}" takes the article "{b}".',
  'casa=la|libro=el|mesa=la|problema=el|mano=la|día=el|ciudad=la|mapa=el|noche=la|coche=el');

B('lang.m68.frnum', 'What is the French word for {a}?', 'Which number is "{b}" in French?', 'In French, {a} is "{b}".',
  'eleven=onze|twelve=douze|thirteen=treize|twenty=vingt|thirty=trente|forty=quarante|fifty=cinquante|sixty=soixante|one hundred=cent');

B('lang.h912.estense', 'Which tense does "{a}" show?', 'Which sentence is in {b_l}?', '"{a}" is in {b_l}.',
  'Yo comí la manzana=the preterite|Yo comía cada día=the imperfect|Yo comeré mañana=the future|Yo he comido ya=the present perfect|Espero que comas=the present subjunctive|Yo comería si pudiera=the conditional');

B('lang.h912.idiom', 'What does the {a} idiom mean?', 'Which idiom means "{b_l}"?', 'The {a} idiom means {b_l}.',
  'Spanish "estar en las nubes"=to be daydreaming|Spanish "costar un ojo de la cara"=to be very expensive|French "avoir le cafard"=to feel down|French "coûter les yeux de la tête"=to cost a fortune|Spanish "ser pan comido"=to be very easy|French "poser un lapin"=to stand someone up');

/* ===================== GENERAL KNOWLEDGE ===================== */
B('gk.k2.colour', 'What colour do you get when you mix {a}?', 'Which two colours make {b}?', 'Mixing {a} makes {b}.',
  'red and yellow=orange|blue and yellow=green|red and blue=purple|black and white=grey|red and white=pink');

B('gk.k2.safety', 'What should you do when {a}?', 'When should you {b_l}?', 'When {a}, you should {b_l}.',
  'you cross a road=look both ways first|the traffic light is red=stop and wait|you ride a bicycle=wear a helmet|you smell smoke in the house=tell an adult straight away|a stranger asks you to go with them=say no and find a trusted adult|you finish eating=wash your hands');

B('gk.k2.count', 'How many {a} are there?', 'Which of these comes to {b}?', 'There are {b} {a}.',
  'days in a week=7|months in a year=12|legs on a spider=8|wheels on a bicycle=2|sides on a square=4|colours in a rainbow=7|hours in a day=24|minutes in an hour=60|legs on an insect=6|players on a basketball team=5');

B('gk.e35.capital', 'What is the capital city of {a}?', 'Which country has the capital {b}?', 'The capital of {a} is {b}.',
  'France=Paris|Japan=Tokyo|India=New Delhi|Egypt=Cairo|Canada=Ottawa|Australia=Canberra|Brazil=Brasília|Kenya=Nairobi|Italy=Rome|Mexico=Mexico City|Spain=Madrid|Thailand=Bangkok|Norway=Oslo|Peru=Lima|Vietnam=Hanoi');

B('gk.e35.continent', 'On which continent is {a}?', 'Which country is in {b}?', '{a} is in {b}.',
  'Egypt=Africa|Brazil=South America|Japan=Asia|Germany=Europe|Australia=Oceania|Canada=North America|Nigeria=Africa|Argentina=South America|Vietnam=Asia|Sweden=Europe');

B('gk.e35.landmark', 'In which country would you find {a}?', 'Which landmark is in {b}?', '{a} is in {b}.',
  'the Eiffel Tower=France|the Taj Mahal=India|the Great Wall=China|the Colosseum=Italy|Machu Picchu=Peru|the Pyramids of Giza=Egypt|the Statue of Liberty=the United States|Big Ben=the United Kingdom|the Sydney Opera House=Australia|Christ the Redeemer=Brazil');

B('gk.e35.ocean', 'Which ocean {a}?', 'Where is the {b}?', 'The {b} {a}.',
  'is the largest on Earth=Pacific Ocean|lies between the Americas and Europe/Africa=Atlantic Ocean|lies south of Asia=Indian Ocean|surrounds Antarctica=Southern Ocean|is the smallest and coldest=Arctic Ocean');

B('gk.m68.branch', 'Which branch of the US government {a}?', 'What does the {b_l} do?', 'The {b_l} {a}.',
  'writes and passes laws=legislative branch|enforces the laws=executive branch|interprets the laws=judicial branch');

B('gk.m68.invent', 'Who is credited with {a}?', 'What is {b} known for?', '{b} is credited with {a}.',
  'formulating the laws of motion=Isaac Newton|the theory of general relativity=Albert Einstein|discovering penicillin=Alexander Fleming|inventing the practical telephone=Alexander Graham Bell|pioneering research on radioactivity=Marie Curie|proposing the theory of evolution by natural selection=Charles Darwin|writing the first computer algorithm=Ada Lovelace|developing the polio vaccine=Jonas Salk');

B('gk.m68.river', 'Through which continent does the {a} mainly flow?', 'Which river flows mainly through {b}?', 'The {a} flows mainly through {b}.',
  'Nile=Africa|Amazon=South America|Ganges=Asia|Danube=Europe|Mississippi=North America|Yangtze=Asia|Congo=Africa|Rhine=Europe');

B('gk.m68.money', 'In money terms, what is {a}?', 'What does {b_l} mean?', '{b} is {a}.',
  'money you set aside instead of spending=saving|money borrowed that must be paid back with interest=a loan|the extra cost of borrowing money=interest|a plan for how income will be spent=a budget|the general rise in prices over time=inflation|money you owe=debt|the money left after costs are paid=profit');

B('gk.h912.doc', 'What is {a}?', 'What does {b} refer to?', '{b} is {a}.',
  'the first ten amendments to the US Constitution=the Bill of Rights|the 1215 charter limiting the English king\'s power=the Magna Carta|the 1948 UN declaration of universal rights=the Universal Declaration of Human Rights|the 1776 document declaring US independence=the Declaration of Independence|the 1787 framework of US government=the US Constitution');

B('gk.h912.econ', 'In economics, what is {a}?', 'What does {b_l} mean?', '{b} is {a}.',
  'the total value of goods and services a country produces=GDP|the share of the labour force without work=the unemployment rate|the rate at which prices rise=inflation|the value of the next-best option given up=opportunity cost|a tax on imported goods=a tariff|the total value of exports minus imports=the trade balance|the rate a central bank charges banks=the policy interest rate');

B('gk.h912.world', 'Which organisation {a}?', 'What does the {b} do?', 'The {b} {a}.',
  'works to maintain international peace and security=United Nations|governs the rules of trade between nations=World Trade Organization|directs international health within the UN=World Health Organization|lends to countries facing balance-of-payments crises=International Monetary Fund|protects children\'s rights worldwide=UNICEF|assesses the science of climate change=IPCC');

/* ===================== COMPUTATIONAL FAMILIES ===================== */
/* Each family: { id, subject, band, make(r, d, form) -> {prompt, options, answer, explain} }
   d = difficulty 0..1 within the band. form = 0|1|2 (restatements of the same idea). */

const FAMS = [];
function F(id, subject, band, make) { FAMS.push({ id, subject, band, make }); }
function mcqNum(r, correct, spread, round, unit) {
  const opts = _shuf(r, _uniqNum(r, correct, 4, spread, round));
  const fmt = v => (unit ? `${v}${unit}` : String(v));
  return { options: opts.map(fmt), answer: fmt(correct) };
}

/* ---- MATH: K-2 ---- */
F('m.k2.add', 'Mathematics', 'k2', (r, d, form) => {
  const top = 10 + Math.round(d * 30);
  const a = _int(r, 1, top), b = _int(r, 1, top), s = a + b;
  if (form === 1) return { prompt: `What number do you add to ${a} to make ${s}?`, ...mcqNum(r, b, 4, 'int'), explain: `${s} − ${a} = ${b}.` };
  if (form === 2) return { prompt: `Maya has ${a} stickers. Her friend gives her ${b} more. How many stickers does Maya have now?`, ...mcqNum(r, s, 4, 'int'), explain: `${a} + ${b} = ${s}.` };
  return { prompt: `${a} + ${b} = ?`, ...mcqNum(r, s, 4, 'int'), explain: `${a} + ${b} = ${s}.` };
});
F('m.k2.sub', 'Mathematics', 'k2', (r, d, form) => {
  const top = 12 + Math.round(d * 30);
  const a = _int(r, 5, top), b = _int(r, 1, a - 1), s = a - b;
  if (form === 1) return { prompt: `What number do you take away from ${a} to get ${s}?`, ...mcqNum(r, b, 4, 'int'), explain: `${a} − ${b} = ${s}.` };
  if (form === 2) return { prompt: `There are ${a} birds on a fence. ${b} fly away. How many birds are left?`, ...mcqNum(r, s, 4, 'int'), explain: `${a} − ${b} = ${s}.` };
  return { prompt: `${a} − ${b} = ?`, ...mcqNum(r, s, 4, 'int'), explain: `${a} − ${b} = ${s}.` };
});
F('m.k2.skip', 'Mathematics', 'k2', (r, d, form) => {
  const step = _pick(r, [2, 3, 5, 10]), start = step * _int(r, 1, 4);
  const seq = [start, start + step, start + 2 * step, start + 3 * step];
  const next = start + 4 * step;
  if (form === 1) return { prompt: `Counting by ${step}s, what number comes just before ${next}?`, ...mcqNum(r, next - step, step + 2, 'int'), explain: `${next} − ${step} = ${next - step}.` };
  if (form === 2) return { prompt: `A shop sells eggs in boxes of ${step}. How many eggs are in 5 boxes?`, ...mcqNum(r, step * 5, step + 3, 'int'), explain: `${step} × 5 = ${step * 5}.` };
  return { prompt: `What comes next? ${seq.join(', ')}, ___`, ...mcqNum(r, next, step + 2, 'int'), explain: `The pattern counts up by ${step}.` };
});
F('m.k2.compare', 'Mathematics', 'k2', (r, d, form) => {
  const top = 20 + Math.round(d * 60);
  let a = _int(r, 1, top), b = _int(r, 1, top); if (a === b) b += 1;
  const big = Math.max(a, b), small = Math.min(a, b);
  if (form === 1) return { prompt: `Which number is smaller, ${a} or ${b}?`, options: _shuf(r, [String(a), String(b), 'They are equal', 'Cannot tell']), answer: String(small), explain: `${small} is less than ${big}.` };
  if (form === 2) return { prompt: `Which sign makes this true?  ${a} ___ ${b}`, options: _shuf(r, ['<', '>', '=', '×']), answer: a < b ? '<' : '>', explain: `${a} is ${a < b ? 'less' : 'greater'} than ${b}.` };
  return { prompt: `Which number is greater, ${a} or ${b}?`, options: _shuf(r, [String(a), String(b), 'They are equal', 'Cannot tell']), answer: String(big), explain: `${big} is greater than ${small}.` };
});
F('m.k2.place', 'Mathematics', 'k2', (r, d, form) => {
  const n = _int(r, 21, 99), tens = Math.floor(n / 10), ones = n % 10;
  if (form === 1) return { prompt: `In the number ${n}, which digit is in the ones place?`, ...mcqNum(r, ones, 4, 'int'), explain: `${n} is ${tens} tens and ${ones} ones.` };
  if (form === 2) return { prompt: `Which number is made of ${tens} tens and ${ones} ones?`, ...mcqNum(r, n, 11, 'int'), explain: `${tens} tens = ${tens * 10}, plus ${ones} ones = ${n}.` };
  return { prompt: `In the number ${n}, which digit is in the tens place?`, ...mcqNum(r, tens, 4, 'int'), explain: `${n} is ${tens} tens and ${ones} ones.` };
});
F('m.k2.shape', 'Mathematics', 'k2', (r, d, form) => {
  const shapes = [['triangle', 3], ['square', 4], ['rectangle', 4], ['pentagon', 5], ['hexagon', 6], ['octagon', 8]];
  const s = _pick(r, shapes);
  if (form === 1) return { prompt: `Which shape has ${s[1]} sides?`, options: _shuf(r, [s[0], ..._shuf(r, shapes.filter(x => x[1] !== s[1]).map(x => x[0])).slice(0, 3)]), answer: s[0], explain: `A ${s[0]} has ${s[1]} sides.` };
  if (form === 2) return { prompt: `A ${s[0]} has how many corners (vertices)?`, ...mcqNum(r, s[1], 3, 'int'), explain: `A ${s[0]} has ${s[1]} sides and ${s[1]} corners.` };
  return { prompt: `How many sides does a ${s[0]} have?`, ...mcqNum(r, s[1], 3, 'int'), explain: `A ${s[0]} has ${s[1]} sides.` };
});
F('m.k2.money', 'Mathematics', 'k2', (r, d, form) => {
  const q = _int(r, 1, 3), dm = _int(r, 1, 4), n = _int(r, 0, 3);
  const total = q * 25 + dm * 10 + n * 5;
  if (form === 1) return { prompt: `Ravi has ${total} cents. If he spends ${Math.min(total - 5, 20)} cents, how much is left?`, ...mcqNum(r, total - Math.min(total - 5, 20), 8, 'int', '¢'), explain: `${total} − ${Math.min(total - 5, 20)} = ${total - Math.min(total - 5, 20)} cents.` };
  if (form === 2) return { prompt: `How many nickels (5¢) make ${total - (total % 5)} cents?`, ...mcqNum(r, (total - (total % 5)) / 5, 3, 'int'), explain: `${total - (total % 5)} ÷ 5 = ${(total - (total % 5)) / 5}.` };
  return { prompt: `What is the total value of ${q} quarter${q > 1 ? 's' : ''}, ${dm} dime${dm > 1 ? 's' : ''} and ${n} nickel${n !== 1 ? 's' : ''}?`, ...mcqNum(r, total, 12, 'int', '¢'), explain: `${q}×25 + ${dm}×10 + ${n}×5 = ${total} cents.` };
});

/* ---- MATH: 3-5 ---- */
F('m.e35.mult', 'Mathematics', 'e35', (r, d, form) => {
  const hi = 9 + Math.round(d * 6);
  const a = _int(r, 2, hi), b = _int(r, 2, 12), p = a * b;
  if (form === 1) return { prompt: `${p} ÷ ${a} = ?`, ...mcqNum(r, b, 4, 'int'), explain: `${a} × ${b} = ${p}, so ${p} ÷ ${a} = ${b}.` };
  if (form === 2) return { prompt: `A classroom has ${a} rows of desks with ${b} desks in each row. How many desks are there?`, ...mcqNum(r, p, 9, 'int'), explain: `${a} × ${b} = ${p}.` };
  return { prompt: `${a} × ${b} = ?`, ...mcqNum(r, p, 9, 'int'), explain: `${a} × ${b} = ${p}.` };
});
F('m.e35.frac', 'Mathematics', 'e35', (r, d, form) => {
  const den = _pick(r, [4, 5, 6, 8, 10, 12]);
  const a = _int(r, 1, den - 2), b = _int(r, 1, den - a);
  const s = a + b;
  // Build distractors from a candidate list, dropping any that collide with the
  // answer or each other — otherwise "2/4 + 2/4" offers 4/4 twice.
  const opts = (ans, cands) => {
    const out = [ans];
    cands.forEach(c => { if (c !== ans && !out.includes(c)) out.push(c); });
    return _shuf(r, out.slice(0, 4));
  };
  if (form === 1) return {
    prompt: `${s}/${den} − ${a}/${den} = ?`,
    ...(() => { const ans = `${b}/${den}`; return { options: opts(ans, [`${b}/${den * 2}`, `${b + 1}/${den}`, `${s}/${den}`, `${b}/${den - 1}`]), answer: ans }; })(),
    explain: `Subtract the numerators: ${s} − ${a} = ${b}, keeping ${den} on the bottom.`
  };
  if (form === 2) return {
    prompt: `A pizza is cut into ${den} equal slices. Ana eats ${a} slices and Ben eats ${b}. What fraction of the pizza did they eat altogether?`,
    ...(() => { const ans = `${s}/${den}`; return { options: opts(ans, [`${s}/${den * 2}`, `${den - s}/${den}`, `${s + 1}/${den}`, `${a}/${den}`]), answer: ans }; })(),
    explain: `${a} + ${b} = ${s} slices out of ${den}.`
  };
  const ans = `${s}/${den}`;
  return {
    prompt: `${a}/${den} + ${b}/${den} = ?`,
    options: opts(ans, [`${s}/${den * 2}`, `${s + 1}/${den}`, `${s - 1}/${den}`, `${a}/${den}`]),
    answer: ans,
    explain: `Add the numerators: ${a} + ${b} = ${s}, keeping ${den} on the bottom.`
  };
});
F('m.e35.area', 'Mathematics', 'e35', (r, d, form) => {
  const l = _int(r, 3, 9 + Math.round(d * 12)), w = _int(r, 2, 9 + Math.round(d * 8));
  const A = l * w, P = 2 * (l + w);
  if (form === 1) return { prompt: `A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter?`, ...mcqNum(r, P, 7, 'int', ' cm'), explain: `Perimeter = 2 × (${l} + ${w}) = ${P} cm.` };
  if (form === 2) return { prompt: `A rug covers ${A} square metres. If it is ${l} m long, how wide is it?`, ...mcqNum(r, w, 4, 'int', ' m'), explain: `${A} ÷ ${l} = ${w} m.` };
  return { prompt: `A rectangle is ${l} cm long and ${w} cm wide. What is its area?`, ...mcqNum(r, A, 12, 'int', ' cm²'), explain: `Area = ${l} × ${w} = ${A} cm².` };
});
F('m.e35.round', 'Mathematics', 'e35', (r, d, form) => {
  const n = _int(r, 120, 9800);
  const r10 = Math.round(n / 10) * 10, r100 = Math.round(n / 100) * 100;
  if (form === 1) return { prompt: `Round ${n} to the nearest hundred.`, ...mcqNum(r, r100, 300, 'int'), explain: `${n} is closest to ${r100}.` };
  if (form === 2) return { prompt: `A stadium holds ${n} people. Rounded to the nearest hundred, about how many is that?`, ...mcqNum(r, r100, 300, 'int'), explain: `${n} rounds to ${r100}.` };
  return { prompt: `Round ${n} to the nearest ten.`, ...mcqNum(r, r10, 30, 'int'), explain: `${n} is closest to ${r10}.` };
});
F('m.e35.dec', 'Mathematics', 'e35', (r, d, form) => {
  const a = Math.round(_int(r, 10, 900) ) / 10, b = Math.round(_int(r, 10, 600)) / 10;
  const s = Math.round((a + b) * 10) / 10;
  if (form === 1) return { prompt: `${s} − ${a} = ?`, ...mcqNum(r, Math.round(b * 10) / 10, 5, '2dp'), explain: `${s} − ${a} = ${b}.` };
  if (form === 2) return { prompt: `A runner covers ${a} km on Monday and ${b} km on Tuesday. How far did she run in total?`, ...mcqNum(r, s, 5, '2dp', ' km'), explain: `${a} + ${b} = ${s} km.` };
  return { prompt: `${a} + ${b} = ?`, ...mcqNum(r, s, 5, '2dp'), explain: `${a} + ${b} = ${s}.` };
});
F('m.e35.factor', 'Mathematics', 'e35', (r, d, form) => {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
  const comps = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24, 25, 27];
  if (form === 1) { const c = _pick(r, comps); const f = []; for (let i = 1; i <= c; i++) if (c % i === 0) f.push(i); return { prompt: `How many factors does ${c} have?`, ...mcqNum(r, f.length, 3, 'int'), explain: `The factors of ${c} are ${f.join(', ')} — that is ${f.length}.` }; }
  if (form === 2) { const p = _pick(r, primes); const m = p * _int(r, 2, 6); return { prompt: `Is ${m} a prime number?`, options: _shuf(r, ['No, it is composite', 'Yes, it is prime', 'It is neither', 'Only if it is odd']), answer: 'No, it is composite', explain: `${m} = ${p} × ${m / p}, so it has more than two factors.` }; }
  const p = _pick(r, primes);
  const ds = _shuf(r, comps).slice(0, 3).map(String);
  return { prompt: `Which of these is a prime number?`, options: _shuf(r, [String(p), ...ds]), answer: String(p), explain: `${p} has exactly two factors: 1 and ${p}. The others can all be divided further.` };
});

/* ---- MATH: 6-8 ---- */
F('m.m68.int', 'Mathematics', 'm68', (r, d, form) => {
  const a = _int(r, -18, 18) || 5, b = _int(r, -18, 18) || -4;
  if (form === 1) return { prompt: `(${a}) × (${b}) = ?`, ...mcqNum(r, a * b, 20, 'int'), explain: `A negative times a negative is positive; a negative times a positive is negative. ${a} × ${b} = ${a * b}.` };
  if (form === 2) return { prompt: `The temperature is ${a}°C and falls by ${Math.abs(b)} degrees. What is the new temperature?`, ...mcqNum(r, a - Math.abs(b), 8, 'int', '°C'), explain: `${a} − ${Math.abs(b)} = ${a - Math.abs(b)}°C.` };
  return { prompt: `(${a}) + (${b}) = ?`, ...mcqNum(r, a + b, 9, 'int'), explain: `${a} + (${b}) = ${a + b}.` };
});
F('m.m68.pct', 'Mathematics', 'm68', (r, d, form) => {
  const p = _pick(r, [5, 10, 12, 15, 20, 25, 30, 40, 60, 75]), n = _int(r, 2, 16) * 20;
  const v = Math.round(p * n / 100 * 100) / 100;
  if (form === 1) return { prompt: `${v} is what percent of ${n}?`, ...mcqNum(r, p, 15, 'int', '%'), explain: `${v} ÷ ${n} = ${(v / n).toFixed(2)} = ${p}%.` };
  if (form === 2) return { prompt: `A jacket costs $${n} and is discounted by ${p}%. How much do you save?`, ...mcqNum(r, v, Math.max(4, Math.round(v / 3)), '2dp', ''), explain: `${p}% of $${n} = $${v}.` };
  return { prompt: `What is ${p}% of ${n}?`, ...mcqNum(r, v, Math.max(4, Math.round(v / 3)), '2dp'), explain: `${p}/100 × ${n} = ${v}.` };
});
F('m.m68.eq', 'Mathematics', 'm68', (r, d, form) => {
  const a = _int(r, 2, 9), x = _int(r, 2, 14), b = _int(r, 1, 25), c = a * x + b;
  if (form === 1) return { prompt: `If ${a}x + ${b} = ${c}, what is the value of 2x?`, ...mcqNum(r, 2 * x, 8, 'int'), explain: `x = ${x}, so 2x = ${2 * x}.` };
  if (form === 2) return { prompt: `A taxi charges a $${b} base fare plus $${a} per kilometre. A ride costs $${c}. How many kilometres was it?`, ...mcqNum(r, x, 5, 'int', ' km'), explain: `${c} − ${b} = ${c - b}; ${c - b} ÷ ${a} = ${x} km.` };
  return { prompt: `Solve for x:  ${a}x + ${b} = ${c}`, ...mcqNum(r, x, 6, 'int'), explain: `${c} − ${b} = ${c - b}; ${c - b} ÷ ${a} = ${x}.` };
});
F('m.m68.ratio', 'Mathematics', 'm68', (r, d, form) => {
  const a = _int(r, 2, 9), b = _int(r, 2, 9), k = _int(r, 2, 9);
  if (form === 1) return { prompt: `If ${a} : ${b} = ${a * k} : ?, what is the missing number?`, ...mcqNum(r, b * k, 9, 'int'), explain: `Both parts scale by ${k}: ${b} × ${k} = ${b * k}.` };
  if (form === 2) return { prompt: `${a * k} pencils cost $${b * k}. At the same rate, what do ${a} pencils cost?`, ...mcqNum(r, b, 5, '2dp', ''), explain: `The unit rate is the same, so ${a} pencils cost $${b}.` };
  return { prompt: `A recipe uses ${a} cups of flour for every ${b} cups of milk. How much milk is needed for ${a * k} cups of flour?`, ...mcqNum(r, b * k, 9, 'int', ' cups'), explain: `Scale by ${k}: ${b} × ${k} = ${b * k} cups.` };
});
F('m.m68.stats', 'Mathematics', 'm68', (r, d, form) => {
  const n = 5, xs = Array.from({ length: n }, () => _int(r, 2, 40));
  const sum = xs.reduce((s, v) => s + v, 0), mean = Math.round(sum / n * 100) / 100;
  const sorted = xs.slice().sort((p, q) => p - q), med = sorted[2], rng = sorted[4] - sorted[0];
  if (form === 1) return { prompt: `What is the median of this data set?  ${xs.join(', ')}`, ...mcqNum(r, med, 8, 'int'), explain: `Sorted: ${sorted.join(', ')}. The middle value is ${med}.` };
  if (form === 2) return { prompt: `What is the range of this data set?  ${xs.join(', ')}`, ...mcqNum(r, rng, 8, 'int'), explain: `${sorted[4]} − ${sorted[0]} = ${rng}.` };
  return { prompt: `What is the mean of this data set?  ${xs.join(', ')}`, ...mcqNum(r, mean, 8, '2dp'), explain: `Sum = ${sum}; ${sum} ÷ ${n} = ${mean}.` };
});
F('m.m68.pyth', 'Mathematics', 'm68', (r, d, form) => {
  const trip = _pick(r, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25]]);
  const k = 1;
  if (form === 1) return { prompt: `A right triangle has a hypotenuse of ${trip[2]} and one leg of ${trip[0]}. How long is the other leg?`, ...mcqNum(r, trip[1] * k, 5, 'int'), explain: `${trip[2]}² − ${trip[0]}² = ${trip[2] ** 2 - trip[0] ** 2}, and √${trip[2] ** 2 - trip[0] ** 2} = ${trip[1]}.` };
  if (form === 2) return { prompt: `A ladder ${trip[2]} m long leans against a wall with its foot ${trip[0]} m from the base. How high up the wall does it reach?`, ...mcqNum(r, trip[1], 5, 'int', ' m'), explain: `√(${trip[2]}² − ${trip[0]}²) = ${trip[1]} m.` };
  return { prompt: `A right triangle has legs of ${trip[0]} and ${trip[1]}. How long is the hypotenuse?`, ...mcqNum(r, trip[2], 5, 'int'), explain: `${trip[0]}² + ${trip[1]}² = ${trip[2] ** 2}, and √${trip[2] ** 2} = ${trip[2]}.` };
});
F('m.m68.circle', 'Mathematics', 'm68', (r, d, form) => {
  const rad = _int(r, 2, 14);
  const area = Math.round(Math.PI * rad * rad * 100) / 100, circ = Math.round(2 * Math.PI * rad * 100) / 100;
  if (form === 1) return { prompt: `A circle has radius ${rad} cm. What is its circumference? (π ≈ 3.14)`, ...mcqNum(r, circ, Math.max(5, Math.round(circ / 4)), '2dp', ' cm'), explain: `C = 2πr = 2 × 3.14 × ${rad} ≈ ${circ} cm.` };
  if (form === 2) return { prompt: `A circular table has a diameter of ${rad * 2} cm. What is its radius?`, ...mcqNum(r, rad, 4, 'int', ' cm'), explain: `Radius = diameter ÷ 2 = ${rad} cm.` };
  return { prompt: `A circle has radius ${rad} cm. What is its area? (π ≈ 3.14)`, ...mcqNum(r, area, Math.max(8, Math.round(area / 4)), '2dp', ' cm²'), explain: `A = πr² = 3.14 × ${rad}² ≈ ${area} cm².` };
});

/* ---- MATH: 9-12 ---- */
F('m.h912.quad', 'Mathematics', 'h912', (r, d, form) => {
  const p = _int(r, 1, 9), q = _int(r, 1, 9);
  const b = -(p + q), c = p * q;
  if (form === 1) return { prompt: `The roots of x² ${b >= 0 ? '+ ' + b : '− ' + -b}x + ${c} = 0 are p and q. What is p + q?`, ...mcqNum(r, p + q, 6, 'int'), explain: `Sum of roots = −b/a = ${p + q}.` };
  if (form === 2) return { prompt: `Factorise: x² ${b >= 0 ? '+ ' + b : '− ' + -b}x + ${c}`, options: _shuf(r, [`(x − ${p})(x − ${q})`, `(x + ${p})(x + ${q})`, `(x − ${p})(x + ${q})`, `(x + ${p})(x − ${q})`]), answer: `(x − ${p})(x − ${q})`, explain: `The factors multiply to ${c} and add to ${-b}.` };
  return { prompt: `Solve: x² ${b >= 0 ? '+ ' + b : '− ' + -b}x + ${c} = 0`, options: _shuf(r, [`x = ${p} or x = ${q}`, `x = ${-p} or x = ${-q}`, `x = ${p} or x = ${-q}`, `x = ${p + q} only`]), answer: `x = ${p} or x = ${q}`, explain: `(x − ${p})(x − ${q}) = 0, so x = ${p} or x = ${q}.` };
});
F('m.h912.fn', 'Mathematics', 'h912', (r, d, form) => {
  const a = _int(r, 2, 6), b = _int(r, 1, 9), x = _int(r, 2, 8);
  const f = a * x * x + b;
  if (form === 1) return { prompt: `If f(x) = ${a}x² + ${b} and g(x) = x + ${b}, what is g(f(1))?`, ...mcqNum(r, a + b + b, 7, 'int'), explain: `f(1) = ${a + b}; g(${a + b}) = ${a + b} + ${b} = ${a + b + b}.` };
  if (form === 2) return { prompt: `For f(x) = ${a}x² + ${b}, what is the y-intercept of the graph?`, ...mcqNum(r, b, 6, 'int'), explain: `Set x = 0: f(0) = ${b}.` };
  return { prompt: `If f(x) = ${a}x² + ${b}, what is f(${x})?`, ...mcqNum(r, f, Math.max(8, Math.round(f / 4)), 'int'), explain: `${a} × ${x}² + ${b} = ${a * x * x} + ${b} = ${f}.` };
});
F('m.h912.trig', 'Mathematics', 'h912', (r, d, form) => {
  const table = [['sin 30°', '1/2'], ['cos 60°', '1/2'], ['sin 60°', '√3/2'], ['cos 30°', '√3/2'], ['tan 45°', '1'], ['sin 45°', '√2/2'], ['cos 45°', '√2/2'], ['tan 60°', '√3'], ['sin 0°', '0'], ['cos 0°', '1'], ['tan 30°', '1/√3']];
  const t = _pick(r, table);
  const pool = ['1/2', '√3/2', '√2/2', '1', '0', '√3', '1/√3'];
  if (form === 1) return { prompt: `Which expression equals ${t[1]}?`, options: _shuf(r, [t[0], ..._shuf(r, table.filter(x => x[1] !== t[1]).map(x => x[0])).slice(0, 3)]), answer: t[0], explain: `${t[0]} = ${t[1]}.` };
  if (form === 2) return { prompt: `In a right triangle, which ratio defines the sine of an angle?`, options: _shuf(r, ['opposite ÷ hypotenuse', 'adjacent ÷ hypotenuse', 'opposite ÷ adjacent', 'hypotenuse ÷ opposite']), answer: 'opposite ÷ hypotenuse', explain: `SOH: sine = opposite over hypotenuse.` };
  return { prompt: `What is the exact value of ${t[0]}?`, options: _shuf(r, [t[1], ..._shuf(r, pool.filter(v => v !== t[1])).slice(0, 3)]), answer: t[1], explain: `${t[0]} = ${t[1]}.` };
});
F('m.h912.log', 'Mathematics', 'h912', (r, d, form) => {
  const base = _pick(r, [2, 3, 5, 10]), e = _int(r, 2, 5), v = Math.pow(base, e);
  if (form === 1) return { prompt: `Solve for x:  ${base}^x = ${v}`, ...mcqNum(r, e, 3, 'int'), explain: `${base}^${e} = ${v}, so x = ${e}.` };
  if (form === 2) return { prompt: `log${base}(${v}) + log${base}(1) = ?`, ...mcqNum(r, e, 3, 'int'), explain: `log of 1 is 0 in any base, so the answer is ${e}.` };
  return { prompt: `What is log${base}(${v})?`, ...mcqNum(r, e, 3, 'int'), explain: `${base}^${e} = ${v}.` };
});
F('m.h912.seq', 'Mathematics', 'h912', (r, d, form) => {
  const a1 = _int(r, 2, 12), dd = _int(r, 2, 9), n = _int(r, 5, 12);
  const an = a1 + (n - 1) * dd;
  const gr = _int(r, 2, 4), g5 = a1 * Math.pow(gr, 4);
  if (form === 1) return { prompt: `A geometric sequence starts at ${a1} with common ratio ${gr}. What is the 5th term?`, ...mcqNum(r, g5, Math.max(10, Math.round(g5 / 4)), 'int'), explain: `${a1} × ${gr}⁴ = ${g5}.` };
  if (form === 2) return { prompt: `In an arithmetic sequence the 1st term is ${a1} and the ${n}th term is ${an}. What is the common difference?`, ...mcqNum(r, dd, 4, 'int'), explain: `(${an} − ${a1}) ÷ ${n - 1} = ${dd}.` };
  return { prompt: `An arithmetic sequence starts at ${a1} with common difference ${dd}. What is the ${n}th term?`, ...mcqNum(r, an, Math.max(6, dd * 2), 'int'), explain: `a₍ₙ₎ = ${a1} + (${n} − 1) × ${dd} = ${an}.` };
});
F('m.h912.prob', 'Mathematics', 'h912', (r, d, form) => {
  const red = _int(r, 2, 9), blue = _int(r, 2, 9), tot = red + blue;
  if (form === 1) return { prompt: `A bag holds ${red} red and ${blue} blue marbles. What is the probability of drawing a blue marble?`, options: _shuf(r, [`${blue}/${tot}`, `${red}/${tot}`, `${blue}/${red}`, `${tot}/${blue}`]), answer: `${blue}/${tot}`, explain: `${blue} favourable outcomes out of ${tot}.` };
  if (form === 2) { const n = _int(r, 4, 7), k = 2; const c = n * (n - 1) / 2; return { prompt: `How many different pairs can be chosen from ${n} students?`, ...mcqNum(r, c, 6, 'int'), explain: `C(${n},2) = ${n} × ${n - 1} ÷ 2 = ${c}.` }; }
  return { prompt: `A bag holds ${red} red and ${blue} blue marbles. What is the probability of drawing a red marble?`, options: _shuf(r, [`${red}/${tot}`, `${blue}/${tot}`, `${red}/${blue}`, `${tot}/${red}`]), answer: `${red}/${tot}`, explain: `${red} favourable outcomes out of ${tot}.` };
});
F('m.h912.sys', 'Mathematics', 'h912', (r, d, form) => {
  const x = _int(r, 1, 9), y = _int(r, 1, 9);
  const a = _int(r, 1, 5), b = _int(r, 1, 5), c = a * x + b * y;
  const e = _int(r, 1, 5), f = _int(r, 1, 5), g = e * x + f * y;
  if (form === 1) return { prompt: `Given ${a}x + ${b}y = ${c} and ${e}x + ${f}y = ${g}, what is x + y?`, ...mcqNum(r, x + y, 6, 'int'), explain: `x = ${x}, y = ${y}, so x + y = ${x + y}.` };
  if (form === 2) return { prompt: `Given ${a}x + ${b}y = ${c} and ${e}x + ${f}y = ${g}, what is the value of y?`, ...mcqNum(r, y, 5, 'int'), explain: `Solving the system gives x = ${x}, y = ${y}.` };
  return { prompt: `Solve the system:  ${a}x + ${b}y = ${c},  ${e}x + ${f}y = ${g}`, options: _shuf(r, [`x = ${x}, y = ${y}`, `x = ${y}, y = ${x}`, `x = ${x + 1}, y = ${y - 1}`, `x = ${x - 1}, y = ${y + 1}`]), answer: `x = ${x}, y = ${y}`, explain: `Substitution or elimination gives x = ${x}, y = ${y}.` };
});

/* ---- SCIENCE computational ---- */
F('s.m68.density', 'Science', 'm68', (r, d, form) => {
  const m = _int(r, 2, 40) * 5, v = _int(r, 2, 20);
  const den = Math.round(m / v * 100) / 100;
  if (form === 1) return { prompt: `An object has a density of ${den} g/cm³ and a volume of ${v} cm³. What is its mass?`, ...mcqNum(r, m, Math.max(6, Math.round(m / 4)), 'int', ' g'), explain: `mass = density × volume = ${den} × ${v} = ${m} g.` };
  if (form === 2) return { prompt: `A block with mass ${m} g floats in water. What must be true of its density? (water = 1 g/cm³)`, options: _shuf(r, ['It is less than 1 g/cm³', 'It is more than 1 g/cm³', 'It is exactly 1 g/cm³', 'Density does not affect floating']), answer: 'It is less than 1 g/cm³', explain: `Objects less dense than water float.` };
  return { prompt: `An object has a mass of ${m} g and a volume of ${v} cm³. What is its density?`, ...mcqNum(r, den, Math.max(3, Math.round(den)), '2dp', ' g/cm³'), explain: `density = mass ÷ volume = ${m} ÷ ${v} = ${den} g/cm³.` };
});
F('s.h912.kin', 'Science', 'h912', (r, d, form) => {
  const u = _int(r, 0, 20), a = _int(r, 1, 9), t = _int(r, 2, 10);
  const v = u + a * t, s = u * t + 0.5 * a * t * t;
  if (form === 1) return { prompt: `An object starts at ${u} m/s and accelerates at ${a} m/s² for ${t} s. How far does it travel?`, ...mcqNum(r, Math.round(s * 10) / 10, Math.max(8, Math.round(s / 4)), '2dp', ' m'), explain: `s = ut + ½at² = ${u}×${t} + 0.5×${a}×${t}² = ${Math.round(s * 10) / 10} m.` };
  if (form === 2) return { prompt: `A car speeds up from ${u} m/s to ${v} m/s in ${t} s. What is its acceleration?`, ...mcqNum(r, a, 4, 'int', ' m/s²'), explain: `a = (v − u)/t = (${v} − ${u})/${t} = ${a} m/s².` };
  return { prompt: `An object starts at ${u} m/s and accelerates at ${a} m/s² for ${t} s. What is its final velocity?`, ...mcqNum(r, v, Math.max(6, Math.round(v / 4)), 'int', ' m/s'), explain: `v = u + at = ${u} + ${a}×${t} = ${v} m/s.` };
});
F('s.h912.punnett', 'Science', 'h912', (r, d, form) => {
  const cases = [
    ['Aa × Aa', '25% homozygous dominant, 50% heterozygous, 25% homozygous recessive', '3 : 1', '25%'],
    ['Aa × aa', '50% heterozygous, 50% homozygous recessive', '1 : 1', '50%'],
    ['AA × aa', 'all offspring heterozygous', '1 : 0', '0%']
  ];
  const c = _pick(r, cases);
  if (form === 1) return { prompt: `For the cross ${c[0]}, what is the expected phenotype ratio (dominant : recessive)?`, options: _shuf(r, ['3 : 1', '1 : 1', '1 : 0', '2 : 1']), answer: c[2], explain: `${c[0]} gives ${c[1]}.` };
  if (form === 2) return { prompt: `For the cross ${c[0]}, what percentage of offspring show the recessive phenotype?`, options: _shuf(r, ['25%', '50%', '0%', '75%']), answer: c[3], explain: `${c[0]} gives ${c[1]}.` };
  return { prompt: `What are the expected genotypes from the cross ${c[0]}?`, options: _shuf(r, cases.map(x => x[1])).concat(['all offspring homozygous dominant']).slice(0, 4), answer: c[1], explain: `A Punnett square for ${c[0]} gives ${c[1]}.` };
});
F('s.h912.mole', 'Science', 'h912', (r, d, form) => {
  const subs = [['H₂O', 18], ['CO₂', 44], ['NaCl', 58.5], ['O₂', 32], ['CH₄', 16], ['NH₃', 17], ['C₆H₁₂O₆', 180]];
  const s = _pick(r, subs), n = _int(r, 2, 6);
  const mass = Math.round(s[1] * n * 10) / 10;
  if (form === 1) return { prompt: `How many moles are in ${mass} g of ${s[0]}? (molar mass ${s[1]} g/mol)`, ...mcqNum(r, n, 3, 'int', ' mol'), explain: `${mass} ÷ ${s[1]} = ${n} mol.` };
  if (form === 2) return { prompt: `What is the molar mass of ${s[0]}?`, ...mcqNum(r, s[1], Math.max(6, Math.round(s[1] / 3)), '2dp', ' g/mol'), explain: `${s[0]} has a molar mass of ${s[1]} g/mol.` };
  return { prompt: `What is the mass of ${n} mol of ${s[0]}? (molar mass ${s[1]} g/mol)`, ...mcqNum(r, mass, Math.max(8, Math.round(mass / 4)), '2dp', ' g'), explain: `${n} × ${s[1]} = ${mass} g.` };
});

/* ---- Band metadata ---- */
/* The product ships for grades 6-12. The two younger bands stay in the codebase
   (their content still feeds the ladder-down source lookup) but are not offered
   at signup and are not marketed, so the site and the app agree. */
const BANDS = [
  { id: 'k2', name: 'Sprouts', grades: 'Grades K–2', ages: 'Ages 5–8', hue: 150, active: false },
  { id: 'e35', name: 'Explorers', grades: 'Grades 3–5', ages: 'Ages 8–11', hue: 200, active: false },
  { id: 'm68', name: 'Navigators', grades: 'Grades 6–8', ages: 'Ages 11–14', hue: 265, active: true },
  { id: 'h912', name: 'Pioneers', grades: 'Grades 9–12', ages: 'Ages 14–18', hue: 20, active: true }
];
const ACTIVE_BANDS = BANDS.filter(b => b.active);
const ACTIVE_GRADES = ['6', '7', '8', '9', '10', '11', '12'];
const GRADE_TO_BAND = { K: 'k2', 1: 'k2', 2: 'k2', 3: 'e35', 4: 'e35', 5: 'e35', 6: 'm68', 7: 'm68', 8: 'm68', 9: 'h912', 10: 'h912', 11: 'h912', 12: 'h912' };

const SUBJECTS = ['Mathematics', 'English Language Arts', 'Science', 'World Languages', 'General Knowledge'];
const SUBJECT_KEY = { 'Mathematics': 'm', 'English Language Arts': 'ela', 'Science': 'sci', 'World Languages': 'lang', 'General Knowledge': 'gk' };

/* Subject mix per 50-question assessment */
const MIX = [
  ['Mathematics', 14],
  ['English Language Arts', 12],
  ['Science', 10],
  ['General Knowledge', 8],
  ['World Languages', 6]
];

/* Level badge names, 1..10 */
const LEVEL_NAMES = ['Spark', 'Ember', 'Beacon', 'Comet', 'Aurora', 'Meridian', 'Summit', 'Eclipse', 'Nova', 'Zenith'];

/* Exclusive quiz definitions: 20 quizzes x 100 questions */
const QUIZZES = [
  { id: 'ms-math-1', tier: 'Middle School', subject: 'Mathematics', title: 'Number Sense Gauntlet', blurb: 'Integers, fractions, ratios and percent, one hundred questions deep.', fams: ['m.m68.int', 'm.m68.pct', 'm.m68.ratio'] },
  { id: 'ms-math-2', tier: 'Middle School', subject: 'Mathematics', title: 'Equation Arena', blurb: 'One- and two-step equations with word problems that bite back.', fams: ['m.m68.eq', 'm.m68.ratio', 'm.m68.int'] },
  { id: 'ms-math-3', tier: 'Middle School', subject: 'Mathematics', title: 'Shape & Space Trial', blurb: 'Circles, right triangles and the Pythagorean theorem.', fams: ['m.m68.circle', 'm.m68.pyth', 'm.e35.area'] },
  { id: 'ms-math-4', tier: 'Middle School', subject: 'Mathematics', title: 'Data Detective', blurb: 'Mean, median, range and reading a data set carefully.', fams: ['m.m68.stats', 'm.m68.pct', 'm.m68.ratio'] },
  { id: 'ms-math-5', tier: 'Middle School', subject: 'Mathematics', title: 'Mixed Maths Marathon', blurb: 'Everything from the middle-school toolkit, shuffled.', fams: ['m.m68.int', 'm.m68.eq', 'm.m68.circle', 'm.m68.stats', 'm.m68.pct'] },
  { id: 'ms-sci-1', tier: 'Middle School', subject: 'Science', title: 'Cells & Systems', blurb: 'Organelles, body systems and how living things are organised.', banks: ['sci.m68.organelle', 'sci.m68.body'] },
  { id: 'ms-sci-2', tier: 'Middle School', subject: 'Science', title: 'Elements Expedition', blurb: 'Chemical symbols and the language of the periodic table.', banks: ['sci.m68.symbol'] },
  { id: 'ms-sci-3', tier: 'Middle School', subject: 'Science', title: 'Forces & Motion', blurb: 'Newton\'s laws, energy forms and density calculations.', banks: ['sci.m68.newton', 'sci.m68.energy'], fams: ['s.m68.density'] },
  { id: 'ms-sci-4', tier: 'Middle School', subject: 'Science', title: 'Earth & Ecosystems', blurb: 'Water cycle, food chains, habitats and the systems that link them.', banks: ['sci.e35.watercycle', 'sci.e35.foodchain', 'sci.e35.matter'] },
  { id: 'ms-sci-5', tier: 'Middle School', subject: 'Science', title: 'Science Sprint', blurb: 'A hundred questions across every middle-school science strand.', banks: ['sci.m68.organelle', 'sci.m68.symbol', 'sci.m68.body', 'sci.m68.energy', 'sci.m68.newton'], fams: ['s.m68.density'] },
  { id: 'hs-math-1', tier: 'High School', subject: 'Mathematics', title: 'Quadratic Proving Ground', blurb: 'Factorising, solving and reading quadratic behaviour.', fams: ['m.h912.quad', 'm.h912.fn'] },
  { id: 'hs-math-2', tier: 'High School', subject: 'Mathematics', title: 'Functions & Graphs', blurb: 'Evaluation, composition and intercepts under time pressure.', fams: ['m.h912.fn', 'm.h912.sys'] },
  { id: 'hs-math-3', tier: 'High School', subject: 'Mathematics', title: 'Trigonometry Ascent', blurb: 'Exact values, ratios and right-triangle reasoning.', fams: ['m.h912.trig', 'm.m68.pyth'] },
  { id: 'hs-math-4', tier: 'High School', subject: 'Mathematics', title: 'Logs, Sequences & Series', blurb: 'Exponential thinking and the patterns behind sequences.', fams: ['m.h912.log', 'm.h912.seq'] },
  { id: 'hs-math-5', tier: 'High School', subject: 'Mathematics', title: 'Probability & Systems', blurb: 'Counting, chance and simultaneous equations.', fams: ['m.h912.prob', 'm.h912.sys', 'm.h912.seq'] },
  { id: 'hs-sci-1', tier: 'High School', subject: 'Science', title: 'Chemistry Core', blurb: 'Bonding, acids and bases, and the vocabulary of reactions.', banks: ['sci.h912.chem'] },
  { id: 'hs-sci-2', tier: 'High School', subject: 'Science', title: 'Stoichiometry Lab', blurb: 'Moles, molar mass and the arithmetic of chemistry.', fams: ['s.h912.mole'], banks: ['sci.h912.chem'] },
  { id: 'hs-sci-3', tier: 'High School', subject: 'Science', title: 'Physics in Motion', blurb: 'Kinematics, units and the quantities physics is built on.', fams: ['s.h912.kin'], banks: ['sci.h912.phys'] },
  { id: 'hs-sci-4', tier: 'High School', subject: 'Science', title: 'Genetics & the Cell', blurb: 'Punnett squares, mitosis, enzymes and inheritance.', fams: ['s.h912.punnett'], banks: ['sci.h912.bio'] },
  { id: 'hs-sci-5', tier: 'High School', subject: 'Science', title: 'Science Capstone', blurb: 'Chemistry, physics, biology and earth science in one run.', banks: ['sci.h912.chem', 'sci.h912.bio', 'sci.h912.phys', 'sci.h912.earth'], fams: ['s.h912.kin', 's.h912.mole'] }
];

window.QQ_CONTENT = { BANKS, FAMS, BANDS, ACTIVE_BANDS, ACTIVE_GRADES, GRADE_TO_BAND, SUBJECTS, SUBJECT_KEY, MIX, LEVEL_NAMES, QUIZZES, _int, _pick, _shuf, _uniqNum };
