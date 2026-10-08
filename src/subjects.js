/* ============================================================
   QuestQuiz — Computer Science, History & Civics, Creative & Arts
   Middle school (6-8) and high school (9-12) fact banks.
   Loaded after content.js, which owns the bank registry.
   ============================================================ */
(function () {
  const C = window.QQ_CONTENT;
  const _int = C._int, _pick = C._pick, _shuf = C._shuf;

  function B(id, q, rv, tf, items) {
    C.BANKS[id] = {
      id, q, rv, tf,
      items: items.split('|').map(s => { const p = s.split('='); return { a: p[0].trim(), b: p[1].trim(), u: 0 }; })
    };
  }

  /* ===================== COMPUTER SCIENCE ===================== */

  B('cs.m68.basics', 'In computing, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'a precise step-by-step set of instructions for solving a problem=an algorithm|a named container that holds a value=a variable|a block of code that repeats while a condition holds=a loop|a named block of code you can call again and again=a function|the process of finding and removing errors in code=debugging|a value that can only be true or false=a Boolean|the physical parts of a computer=hardware|the programs that run on a computer=software|a choice in code that runs one branch or another=a conditional statement|an ordered list of values stored under one name=an array|a mistake in code that makes it behave wrongly=a bug|a note in code for humans that the computer ignores=a comment');

  B('cs.m68.binary', 'In how computers store data, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'a single 0 or 1=a bit|a group of eight bits=a byte|the number system computers use, with only 0 and 1=binary|roughly one thousand bytes=a kilobyte|roughly one million bytes=a megabyte|roughly one billion bytes=a gigabyte|the standard that maps letters to numbers=ASCII|the smallest dot of colour in a digital image=a pixel|making a file smaller without losing information=lossless compression|making a file smaller by discarding some detail=lossy compression');

  B('cs.m68.internet', 'On the internet, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the address you type to reach a web page=a URL|a computer that stores and sends web pages to others=a server|the computer or phone asking for a web page=a client|a unique number identifying a device on a network=an IP address|the system that turns a domain name into an IP address=DNS|a small chunk that data is split into before travelling=a packet|the language that structures a web page=HTML|the language that styles a web page=CSS|the language that makes a web page interactive=JavaScript|a program for viewing web pages=a browser|the amount of data a connection can carry per second=bandwidth|the delay before data starts arriving=latency');

  B('cs.m68.safety', 'In online safety, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'a message pretending to be someone trusted to steal your details=phishing|software written to damage or steal from a computer=malware|a second step beyond a password when signing in=two-factor authentication|a copy of your files kept somewhere else in case of loss=a backup|scrambling data so only the right person can read it=encryption|a password that is long, unique and hard to guess=a strong password|deliberately cruel behaviour repeated online=cyberbullying|the trail of information you leave online=a digital footprint|a barrier that filters traffic entering a network=a firewall|software that locks your files until you pay=ransomware');

  B('cs.h912.prog', 'In programming, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'a function that calls itself=recursion|a way of describing how run time grows with input size=Big-O notation|translating source code into machine code before it runs=compiling|running source code line by line as it executes=interpreting|a value passed into a function=an argument|the region of a program where a name is visible=scope|a set of rules that lets one program talk to another=an API|a structure that stores key and value pairs=a dictionary|a first-in first-out structure=a queue|a last-in first-out structure=a stack|a search that repeatedly halves a sorted list=binary search|a variable that only exists inside one function=a local variable|a reusable collection of prewritten code=a library|a system that tracks every change to a codebase=version control');

  B('cs.h912.systems', 'In computer systems, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the part of the computer that carries out instructions=the CPU|fast temporary memory a running program uses=RAM|storage that keeps data when the power is off=persistent storage|software that manages hardware and other programs=an operating system|an organised collection of data you can query=a database|delivering computing over the internet instead of a local machine=cloud computing|splitting work across several processors at once=parallel computing|encryption using one shared key=symmetric encryption|encryption using a public and a private key=asymmetric encryption|a system built to keep working when a part fails=fault tolerance|a base-16 number system used to write bytes compactly=hexadecimal');

  B('cs.h912.ethics', 'In computing and society, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'a system producing unfair outcomes because of skewed training data=algorithmic bias|software whose source anyone may inspect and reuse=open source|the gap between those with and without reliable computing access=the digital divide|information that can identify a specific person=personally identifiable information|training a system to find patterns rather than coding rules by hand=machine learning|legal protection for an original creative work=copyright|a licence letting creators share work on set terms=Creative Commons|collecting far more data than a service needs to function=over-collection|the right to have your personal data erased=the right to erasure|designing a product so people with disabilities can use it=accessibility');

  /* ===================== HISTORY & CIVICS ===================== */

  B('hist.m68.ancient', 'Which ancient civilisation {a}?', 'What is {b} known for?', '{b} {a}.',
    'built pyramids along the Nile and wrote in hieroglyphs=Ancient Egypt|developed the first known writing, cuneiform, between two rivers=Mesopotamia|gave us democracy, philosophers and the Olympic Games=Ancient Greece|built roads, aqueducts and a republic that became an empire=Ancient Rome|invented paper, gunpowder and the compass=Ancient China|built cities with planned drainage in the Indus valley=the Indus Valley Civilisation|built step pyramids and a precise calendar in Mesoamerica=the Maya|built Machu Picchu high in the Andes=the Inca|traded gold and salt across West Africa from Timbuktu=the Mali Empire');

  B('hist.m68.us', 'In United States history, what do we call {a}?', 'What does {b} refer to?', '{b} was {a}.',
    'the 1776 statement that the colonies were free of Britain=the Declaration of Independence|the 1787 document that set up the federal government=the Constitution|the first ten amendments protecting individual rights=the Bill of Rights|the 1803 purchase that doubled the size of the country=the Louisiana Purchase|the 1861-65 war between the northern and southern states=the Civil War|the 1863 order freeing enslaved people in rebelling states=the Emancipation Proclamation|the amendment that abolished slavery=the Thirteenth Amendment|the amendment that gave women the vote=the Nineteenth Amendment|the 1930s economic collapse and mass unemployment=the Great Depression|the 1950s-60s struggle to end legal segregation=the Civil Rights Movement|the forced removal of Cherokee and other nations westward=the Trail of Tears');

  B('hist.m68.civics', 'In United States civics, which body or principle {a}?', 'Which of these best describes {b_l}?', '{b} {a}.',
    'writes and passes the laws=Congress|carries out and enforces the laws=the executive branch|decides what the laws mean=the Supreme Court|divides power between national and state governments=federalism|lets each branch limit the power of the others=checks and balances|lists the rights the government may not take away=the Bill of Rights|lets citizens choose their representatives=voting|calls a citizen to help decide a court case=jury duty|sets the rules a town or city follows=local government|changes the Constitution when enough states agree=the amendment process');

  B('hist.h912.modern', 'In modern world history, what was {a}?', 'What does {b} refer to?', '{b} was {a}.',
    'the 1914-18 war triggered by alliances and an assassination=the First World War|the 1919 treaty that punished Germany and redrew Europe=the Treaty of Versailles|the 1917 revolution that brought the Bolsheviks to power=the Russian Revolution|the 1939-45 global war ending with the defeat of the Axis=the Second World War|the Nazi genocide of six million Jews=the Holocaust|the post-1945 standoff between the US and the Soviet Union=the Cold War|the 1948-49 airlift supplying a blockaded German city=the Berlin Airlift|the process by which colonies gained independence after 1945=decolonisation|the 1947 division of British India into two states=Partition|the 1989 event that signalled the end of divided Europe=the fall of the Berlin Wall|the system of enforced racial segregation in South Africa=apartheid|the 1955-75 conflict in Southeast Asia=the Vietnam War');

  B('hist.h912.ideas', 'In history, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the 18th-century movement built on reason and natural rights=the Enlightenment|the shift to mechanised factory production from about 1760=the Industrial Revolution|the European revival of classical art and learning=the Renaissance|the 16th-century split in Western Christianity=the Reformation|the policy of extending control over other territories=imperialism|an economic system built on private ownership and markets=capitalism|an economic system built on collective ownership=socialism|government by the people through elected representatives=democracy|rule by a single leader with total power=autocracy|loyalty to a nation as a political identity=nationalism|the growing interconnection of economies worldwide=globalisation');

  B('hist.h912.cases', 'Which Supreme Court case {a}?', 'What was decided in {b}?', '{b} {a}.',
    'established that courts can strike down unconstitutional laws=Marbury v. Madison|ruled that segregated schools are unconstitutional=Brown v. Board of Education|required that suspects be told their rights on arrest=Miranda v. Arizona|guaranteed a lawyer to defendants who cannot afford one=Gideon v. Wainwright|upheld "separate but equal" before it was overturned=Plessy v. Ferguson|protected student speech in schools within limits=Tinker v. Des Moines');

  /* ===================== CREATIVE & ARTS ===================== */

  B('art.m68.visual', 'In visual art, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the path a moving point makes=line|the lightness or darkness of a colour=value|the surface quality of a work, real or implied=texture|the way parts are arranged within a work=composition|the illusion of depth on a flat surface=perspective|the point where lines appear to meet on the horizon=the vanishing point|red, yellow and blue, which cannot be mixed from others=primary colours|orange, green and violet, mixed from two primaries=secondary colours|colours opposite each other on the colour wheel=complementary colours|colours sitting next to each other on the wheel=analogous colours|the empty area around and between subjects=negative space|the part of a work the eye is drawn to first=the focal point');

  B('art.m68.music', 'In music, what is the term for {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the steady pulse you tap your foot to=the beat|the pattern of long and short sounds=rhythm|how fast or slow a piece is played=tempo|how loud or soft the music is=dynamics|a sequence of single notes you can hum=a melody|several notes sounded together=a chord|the highness or lowness of a sound=pitch|the distance between two pitches=an interval|the family including violin, viola and cello=strings|the family including flute, clarinet and oboe=woodwind|the family including trumpet, trombone and tuba=brass|the symbol showing which notes a stave carries=a clef');

  B('art.m68.story', 'In storytelling and drama, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the sequence of events in a story=the plot|the problem driving the story forward=the conflict|the moment of greatest tension=the climax|the person the story follows=the protagonist|the character who opposes them=the antagonist|the time and place the story happens=the setting|a drawing-by-drawing plan of shots before filming=a storyboard|the written text of a play or film=the script|the spoken words between characters=dialogue|a first version made to be improved=a draft');

  B('art.h912.movements', 'In art history, which movement {a}?', 'What is {b} known for?', '{b} {a}.',
    'captured fleeting light with visible brushstrokes in 1870s France=Impressionism|broke objects into geometric planes seen from many angles=Cubism|painted dreamlike images from the unconscious=Surrealism|revived classical proportion and perspective in 15th-century Italy=the Renaissance|used dramatic light, motion and emotion in the 17th century=the Baroque|poured and dripped paint to record the act of painting=Abstract Expressionism|took its imagery from advertising and mass media=Pop Art|used bold, non-natural colour for emotional effect=Fauvism|distorted form to express inner feeling rather than appearance=Expressionism|reduced work to simple geometry and few materials=Minimalism');

  B('art.h912.design', 'In design, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the art of arranging type so it is readable and appealing=typography|a typeface with small strokes finishing each letter=a serif|a typeface without those finishing strokes=a sans serif|the vertical space between lines of text=leading|the spacing between individual letters=kerning|arranging elements so the eye reads the most important first=visual hierarchy|the difference in brightness or colour that makes things stand out=contrast|the additive colour model used by screens=RGB|the subtractive colour model used in printing=CMYK|leaving deliberate empty space in a layout=white space|a grid or rule that keeps a layout consistent=alignment|a set of rules covering a brand\'s look and voice=a style guide');

  B('art.h912.film', 'In film and media, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'a shot taken from far away showing the whole scene=a wide shot|a shot filling the frame with a face=a close-up|cutting a sequence of shots into a compressed passage of time=a montage|everything deliberately placed within the frame=mise-en-scene|the moment one shot changes to the next=a cut|moving the camera sideways across a scene=a pan|the person who shapes the visual look of a film=the cinematographer|sound whose source is visible in the scene=diegetic sound|the arrangement of subjects within the frame=framing|the rule of placing subjects a third of the way across=the rule of thirds');

  /* ---------------- a computational family for CS ---------------- */
  C.FAMS.push({
    id: 'cs.m68.convert', subject: 'Computer Science', band: 'm68',
    make: (r, d, form) => {
      const n = _int(r, 5, 60 + Math.round(d * 180));
      const bin = n.toString(2), hex = n.toString(16).toUpperCase();
      const near = v => {
        const out = [v];
        let g = 0;
        while (out.length < 4 && g++ < 40) {
          const cand = (Number(v === bin ? parseInt(v, 2) : parseInt(v, 16)) + _int(r, 1, 6) * (r() < .5 ? -1 : 1));
          if (cand > 0) { const s = v === bin ? cand.toString(2) : cand.toString(16).toUpperCase(); if (!out.includes(s)) out.push(s); }
        }
        return _shuf(r, out);
      };
      if (form === 1) return {
        prompt: `What is the binary number ${bin} in decimal?`,
        options: _shuf(r, Array.from(new Set([n, n + _int(r, 1, 5), Math.max(1, n - _int(r, 1, 5)), n * 2])).map(String)).slice(0, 4),
        answer: String(n),
        explain: `Each place is a power of two; ${bin} adds up to ${n}.`
      };
      if (form === 2) return {
        prompt: `How many bits are needed to write the decimal number ${n} in binary?`,
        options: _shuf(r, Array.from(new Set([bin.length, bin.length + 1, Math.max(1, bin.length - 1), bin.length + 2])).map(String)).slice(0, 4),
        answer: String(bin.length),
        explain: `${n} is ${bin} in binary, which is ${bin.length} bits long.`
      };
      return {
        prompt: `What is the decimal number ${n} in binary?`,
        options: near(bin),
        answer: bin,
        explain: `${n} in binary is ${bin}. Each position is a power of two.`
      };
    }
  });

  /* ===================== YOUNGER GRADES =====================
     The three subjects above start at grade 6. Without K-5 banks their slots
     in the subject mix generate nothing and an assessment comes up short, so
     each one gets an age-appropriate bank for the Sprouts and Explorers bands. */

  B('cs.k2.parts', 'Which part of a computer {a}?', 'What does the {b_l} do?', 'The {b_l} {a}.',
    'shows you pictures and words=screen|lets you type letters and numbers=keyboard|you move and click to point at things=mouse|lets you hear sounds and music=speaker|lets the computer hear your voice=microphone|takes photos and video of you=camera|stores your files and pictures=memory|does the thinking and the sums=processor');

  B('cs.k2.steps', 'When you give a computer instructions, {a}', 'Which rule is "{b}"?', 'When you give instructions, {a} — {b}.',
    'what do we call a list of steps in the right order?=an algorithm|what happens if you swap two steps around?=the result changes|what do we call telling the computer to do something again and again?=a loop|what do we call a mistake in the steps?=a bug|what do we call fixing a mistake in the steps?=debugging|does the computer guess what you meant?=no, it follows exactly what you say');

  B('cs.k2.safe', 'Online, what should you do when {a}?', 'When should you {b_l}?', 'When {a}, you should {b_l}.',
    'a game asks for your full name and address=tell a trusted adult first|someone you do not know sends you a message=do not reply and tell an adult|you need a password=keep it secret from everyone but a parent|someone online is unkind to you=tell a trusted adult straight away|a pop-up says you have won a prize=close it and tell an adult|you want to download something new=ask a parent first');

  B('cs.e35.basics', 'In computing, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'a step-by-step set of instructions=an algorithm|the physical parts you can touch=hardware|the programs that run on the computer=software|a part that puts information in, like a keyboard=an input device|a part that gives information out, like a screen=an output device|a step that repeats=a loop|a mistake in a program=a bug|finding and fixing mistakes=debugging|a named box that holds a value=a variable|a set of pages you can visit online=a website|a place where files are stored=a folder|breaking a big problem into smaller ones=decomposition');

  B('cs.e35.safety', 'In online safety, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'information that could identify you, like your address=personal information|a secret word that protects your account=a password|a message pretending to be someone you trust=a scam message|being repeatedly unkind to someone online=cyberbullying|the trail of what you do online=a digital footprint|checking with a parent before installing something=asking permission|a password that is long and hard to guess=a strong password|keeping your account signed out on a shared computer=good practice');

  B('hist.k2.helpers', 'Who helps the community by {a}?', 'What does a {b_l} do?', 'A {b_l} helps by {a}.',
    'putting out fires and keeping people safe=firefighter|caring for people who are ill=doctor|teaching children at school=teacher|helping you find and borrow books=librarian|delivering letters and parcels=postal worker|keeping the streets safe and helping in trouble=police officer|growing the food we eat=farmer|driving people safely to school=bus driver|building and fixing houses=builder|caring for animals that are unwell=vet');

  B('hist.k2.symbols', 'What is {a}?', 'What is the {b_l}?', '{b} is {a}.',
    'the flag of the United States, with stars and stripes=the Stars and Stripes|the bird that stands for the United States=the bald eagle|the statue in New York harbour that welcomes people=the Statue of Liberty|the song sung before big events in the United States=the national anthem|the building where the President lives and works=the White House|the day the United States celebrates its independence=the Fourth of July|the bell in Philadelphia that stands for freedom=the Liberty Bell');

  B('hist.k2.rules', 'Why do we have a rule that says {a}?', 'Which rule says "{b}"?', 'The rule "{b}" exists because {a}.',
    'everyone gets a turn=to be fair to everybody|we put our hand up to speak=so everyone can be heard|we do not take things that are not ours=to respect other people|we tidy up after ourselves=to look after shared spaces|we are kind with our words=so nobody gets hurt|we line up to wait=so it is fair and safe|we listen when someone else is talking=to show respect');

  B('hist.e35.branches', 'In the United States, who or what {a}?', 'What does the {b_l} do?', 'The {b_l} {a}.',
    'makes the laws=Congress|leads the country and signs laws=the President|decides what laws mean=the Supreme Court|leads a state=the governor|leads a city or town=the mayor|is the plan of government for the whole country=the Constitution|lists the basic freedoms of the people=the Bill of Rights|is a choice the people make together=an election');

  B('hist.e35.timeline', 'In history and geography, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'a line showing when events happened in order=a timeline|one hundred years=a century|ten years=a decade|a story about the past passed down by families=oral history|an object from the past that tells us about people=an artefact|a very large area of land, like Africa or Asia=a continent|a land with its own government=a country|a smaller region inside a country, like Louisiana=a state|a drawing of a place seen from above=a map|the part of a map that explains the symbols=the key');

  B('art.k2.colour', 'In art, {a}', 'Which colours are "{b}"?', 'In art, {a} — {b}.',
    'which colours are the three primary colours?=red, yellow and blue|which colours do you mix to make green?=blue and yellow|which colours do you mix to make orange?=red and yellow|which colours do you mix to make purple?=red and blue|what do we call colours that feel warm, like red and orange?=warm colours|what do we call colours that feel cool, like blue and green?=cool colours');

  B('art.k2.music', 'Which family does the {a} belong to?', 'Which instrument is in the {b_l} family?', 'The {a} is in the {b_l} family.',
    'drum=percussion|guitar=string|violin=string|flute=woodwind|trumpet=brass|piano=keyboard|tambourine=percussion|cello=string|clarinet=woodwind|trombone=brass');

  B('art.k2.story', 'In a story, what do we call {a}?', 'What is the {b_l} of a story?', 'In a story, {a} is called {b_l}.',
    'the people or animals it is about=the characters|where and when it happens=the setting|what happens first=the beginning|what happens last=the ending|the problem the characters face=the problem|the person telling the story=the narrator');

  B('art.e35.elements', 'In art, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'how a surface looks or feels, rough or smooth=texture|a repeated shape or colour=a pattern|when both halves match=symmetry|the lightness or darkness of a colour=value|the space an object takes up=form|a painting of a person=a portrait|a painting of the countryside or a view=a landscape|a painting of objects arranged on a table=a still life|the main thing your eye goes to first=the focal point|mixing white into a colour to lighten it=a tint');

  B('art.e35.music', 'In music, what does {a} mean?', 'Which of these best describes {b_l}?', '{b} means {a}.',
    'how fast or slow the music goes=tempo|how loud or soft the music is=dynamics|the steady pulse you can clap along to=the beat|the tune you can sing=the melody|several notes played together=a chord|the pattern of long and short sounds=rhythm|how high or low a note is=pitch|a group of musicians playing together=an ensemble');

  /* ---------------- register the new subjects ---------------- */
  C.SUBJECT_KEY['Computer Science'] = 'cs';
  C.SUBJECT_KEY['History & Civics'] = 'hist';
  C.SUBJECT_KEY['Creative & Arts'] = 'art';
  ['Computer Science', 'History & Civics', 'Creative & Arts'].forEach(s => {
    if (!C.SUBJECTS.includes(s)) C.SUBJECTS.push(s);
  });

  /* Fifty questions per assessment, weighted differently by band. Younger bands
     lean harder on the core three; the wider subject spread arrives from grade 6,
     where the curriculum actually separates them out. Every subject named here
     has banks for that band — an unfilled slot would shorten the assessment. */
  C.MIX_BY_BAND = {
    k2: [['Mathematics', 13], ['English Language Arts', 11], ['Science', 9], ['General Knowledge', 6],
         ['Creative & Arts', 5], ['World Languages', 3], ['History & Civics', 2], ['Computer Science', 1]],
    e35: [['Mathematics', 12], ['English Language Arts', 10], ['Science', 9], ['General Knowledge', 5],
          ['History & Civics', 5], ['Creative & Arts', 4], ['Computer Science', 3], ['World Languages', 2]],
    m68: [['Mathematics', 10], ['English Language Arts', 8], ['Science', 8], ['Computer Science', 6],
          ['History & Civics', 6], ['World Languages', 4], ['Creative & Arts', 4], ['General Knowledge', 4]],
    h912: [['Mathematics', 10], ['English Language Arts', 8], ['Science', 8], ['Computer Science', 6],
           ['History & Civics', 6], ['World Languages', 4], ['Creative & Arts', 4], ['General Knowledge', 4]]
  };
  C.MIX.length = 0;
  C.MIX_BY_BAND.m68.forEach(m => C.MIX.push(m));
})();
