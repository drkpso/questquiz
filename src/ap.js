/* ============================================================
   QuestQuiz — Advanced Placement module
   20 AP courses with College Board unit structure, unit-tagged
   question banks, and AP-level computational families.
   ============================================================ */
(function () {
  const C = window.QQ_CONTENT;
  const _int = C._int, _pick = C._pick, _shuf = C._shuf;

  /* Bank helper — items carry an optional third segment: the unit number. */
  function AB(id, q, rv, tf, items) {
    C.BANKS[id] = {
      id, q, rv, tf,
      items: items.split('|').map(s => {
        const p = s.split('=');
        return { a: p[0].trim(), b: p[1].trim(), u: p[2] ? Number(p[2]) : 0 };
      })
    };
  }

  /* ---------------- MATH & COMPUTER SCIENCE ---------------- */

  AB('ap.calc.concept', 'In calculus, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the value a function approaches as the input approaches a point=a limit=1|a function with no breaks, holes or jumps over an interval=a continuous function=1|the instantaneous rate of change of a function=the derivative=2|the rule for differentiating a product of two functions=the product rule=2|the rule for differentiating a composite function=the chain rule=3|a point where the derivative is zero or undefined=a critical point=5|the test using the sign of the second derivative to classify a critical point=the second derivative test=5|the theorem guaranteeing a point where the instantaneous rate equals the average rate=the Mean Value Theorem=5|the reverse process of differentiation=antidifferentiation=6|the limit of a Riemann sum as the partition width approaches zero=the definite integral=6|the theorem linking differentiation and integration=the Fundamental Theorem of Calculus=6|the technique of substituting to simplify an integral=u-substitution=6|a differential equation solved by separating the variables=a separable differential equation=7|the method of finding volume by integrating cross-sectional area=the disc method=8|the rate of change of velocity with respect to time=acceleration=4|a point where a curve changes concavity=an inflection point=5');

  AB('ap.calcbc.concept', 'In BC calculus, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'an infinite sum of terms of a sequence=a series=10|a power series expansion of a function about x = 0=a Maclaurin series=10|a power series expansion about an arbitrary point=a Taylor series=10|the test comparing a series to an improper integral=the integral test=10|a series whose terms alternate in sign=an alternating series=10|the technique of integrating a product using a reduction formula=integration by parts=6|an integral with an infinite limit or an unbounded integrand=an improper integral=6|a curve described by x(t) and y(t)=a parametric curve=9|a curve described by r as a function of theta=a polar curve=9|the length of a curve found by integration=arc length=9|a numerical method that steps along a tangent line=Euler\'s method=7|a model where growth slows as it approaches a carrying capacity=logistic growth=7');

  AB('ap.stats.concept', 'In statistics, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'a numerical summary of a sample=a statistic=1|a numerical summary of a population=a parameter=1|the difference between the first and third quartiles=the interquartile range=1|a value more than 1.5 IQRs beyond a quartile=an outlier=1|the number of standard deviations a value sits from the mean=a z-score=1|a study where treatments are deliberately imposed=an experiment=3|a study that observes without imposing treatment=an observational study=3|assigning subjects to treatments by chance=random assignment=3|a variable that confuses the effect of the explanatory variable=a confounding variable=3|the distribution of a statistic over all possible samples=a sampling distribution=5|a statistic whose mean equals the parameter=an unbiased estimator=5|the probability of rejecting a true null hypothesis=a Type I error=6|the probability of failing to reject a false null hypothesis=a Type II error=6|the probability of correctly rejecting a false null hypothesis=the power of a test=6|the probability of a result at least as extreme as the one observed, assuming the null is true=a p-value=6|a range of plausible values for a parameter=a confidence interval=6|the test comparing observed and expected counts=a chi-square test=8|the line minimising the sum of squared residuals=the least-squares regression line=2|the observed value minus the predicted value=a residual=2|the proportion of variation in y explained by the model=the coefficient of determination=2');

  AB('ap.precalc.concept', 'In precalculus, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'a function whose output changes by a constant amount over equal inputs=a linear function=1|a function whose output changes by a constant factor over equal inputs=an exponential function=2|the horizontal line a function approaches at infinity=a horizontal asymptote=1|the vertical line where a rational function is undefined=a vertical asymptote=1|the inverse of an exponential function=a logarithmic function=2|half the distance between the maximum and minimum of a sinusoid=the amplitude=3|the horizontal length of one complete cycle=the period=3|a horizontal shift of a periodic function=a phase shift=3|a number of the form a + bi=a complex number=4|a rule that maps each input to exactly one output=a function=1|a function that is its own reflection across the y-axis=an even function=1|a function symmetric about the origin=an odd function=1');

  AB('ap.csa.concept', 'In AP Computer Science A, what is {a}?', 'Which of these best describes {b_l} in Java?', '{b} is {a}.',
    'a blueprint from which objects are created=a class=2|a specific instance created from a class=an object=2|a special method that initialises a new object=a constructor=2|a variable belonging to the class rather than any instance=a static variable=2|a method that calls itself=a recursive method=10|a class acquiring fields and methods from a parent class=inheritance=9|defining a method in a subclass that replaces the parent version=overriding=9|defining several methods with the same name but different parameters=overloading=2|choosing the method implementation at run time based on the object type=polymorphism=9|a fixed-size ordered collection of elements=an array=6|a resizable ordered collection from the Java library=an ArrayList=7|an array whose elements are themselves arrays=a 2D array=8|a loop that reads each element without an index=an enhanced for loop=6|an algorithm that repeatedly halves a sorted search space=binary search=10|a sort that repeatedly selects the smallest remaining element=selection sort=10|a sort that builds a sorted prefix one element at a time=insertion sort=10|a divide-and-conquer sort with O(n log n) behaviour=merge sort=10|hiding internal state behind public methods=encapsulation=5|an error thrown when code indexes past the end of an array=ArrayIndexOutOfBoundsException=6|a keyword restricting access to within the class=private=5');

  AB('ap.csp.concept', 'In AP Computer Science Principles, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'a precise sequence of steps that solves a problem=an algorithm=3|breaking a problem into smaller manageable parts=decomposition=3|hiding detail to focus on the essential=abstraction=3|a named reference that holds a value=a variable=3|a segment of code that can be called by name=a procedure=3|the practice of splitting a task across multiple processors=parallel computing=4|the rule set that governs how data moves across a network=a protocol=4|breaking data into pieces before sending it over a network=packets=4|compression where no information is lost=lossless compression=2|compression where some information is discarded=lossy compression=2|the gap between those with and without reliable computing access=the digital divide=5|scrambling data so only an authorised party can read it=encryption=5|encryption using one shared key=symmetric encryption=5|encryption using a public and a private key=asymmetric encryption=5|deceiving a person into revealing credentials=phishing=5|very large data sets analysed for patterns=big data=2|information that can identify a specific person=personally identifiable information=5|a system built so it keeps working when a part fails=fault tolerance=4');

  /* ---------------- SCIENCES ---------------- */

  AB('ap.bio.concept', 'In AP Biology, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the bond giving water its cohesion and high specific heat=the hydrogen bond=1|the monomer of a protein=an amino acid=1|the monomer of a nucleic acid=a nucleotide=1|the organelle that carries out aerobic respiration=the mitochondrion=2|the organelle where photosynthesis occurs=the chloroplast=2|movement of water across a selectively permeable membrane=osmosis=2|transport requiring ATP to move a solute against its gradient=active transport=2|the energy currency of the cell=ATP=3|the enzyme region where the substrate binds=the active site=3|a molecule that binds away from the active site and changes enzyme shape=an allosteric regulator=3|the light-independent reactions of photosynthesis=the Calvin cycle=3|the cell division producing two identical diploid cells=mitosis=4|the division producing four haploid gametes=meiosis=5|the exchange of segments between homologous chromosomes=crossing over=5|the law stating allele pairs separate during gamete formation=the law of segregation=5|the process of copying DNA into messenger RNA=transcription=6|the process of building a protein from mRNA=translation=6|a three-nucleotide sequence coding for one amino acid=a codon=6|the equation predicting allele frequencies in a stable population=Hardy-Weinberg=7|the process by which populations change over generations=evolution=7|the maximum population an environment can sustain=carrying capacity=8|an organism that makes its own food=an autotroph=8');

  AB('ap.chem.concept', 'In AP Chemistry, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the number of particles in one mole=Avogadro\'s number=1|the mass of one mole of a substance=molar mass=1|the energy needed to remove an electron from a gaseous atom=ionisation energy=2|the tendency of an atom to attract bonding electrons=electronegativity=2|the model predicting molecular shape from electron pair repulsion=VSEPR theory=2|a bond where electrons are shared unequally=a polar covalent bond=2|the attraction between temporary dipoles=London dispersion forces=3|the strong dipole attraction involving H bonded to N, O or F=hydrogen bonding=3|the speed at which reactants are converted to products=the reaction rate=5|the minimum energy needed for a reaction to proceed=activation energy=5|the slowest step in a reaction mechanism=the rate-determining step=5|the state where forward and reverse rates are equal=chemical equilibrium=7|the principle predicting how equilibrium shifts under stress=Le Chatelier\'s principle=7|a solution that resists changes in pH=a buffer=8|the pH at which an acid is half neutralised=the pKa=8|the measure of disorder in a system=entropy=9|the quantity that predicts spontaneity at constant temperature and pressure=Gibbs free energy=9|a reaction involving transfer of electrons=a redox reaction=9|the electrode where oxidation occurs=the anode=9');

  AB('ap.phys.concept', 'In AP Physics 1, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the rate of change of position with time=velocity=1|the rate of change of velocity with time=acceleration=1|the product of mass and velocity=momentum=4|the product of force and the time it acts=impulse=4|the law stating an object resists a change in its motion=Newton\'s first law=2|the relationship F = ma=Newton\'s second law=2|the rule that forces come in equal and opposite pairs=Newton\'s third law=2|the force opposing relative motion between surfaces=friction=2|energy an object has because of its motion=kinetic energy=3|energy stored because of position in a field=potential energy=3|the rate at which work is done=power=3|a quantity that stays constant in an isolated system=a conserved quantity=4|the turning effect of a force about a pivot=torque=5|the resistance of an object to angular acceleration=rotational inertia=5|motion that repeats and has a restoring force proportional to displacement=simple harmonic motion=6|the time for one complete oscillation=the period=6|the distance between successive crests of a wave=the wavelength=7|a wave where the medium moves perpendicular to the wave direction=a transverse wave=7');

  AB('ap.envsci.concept', 'In AP Environmental Science, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the variety of life in an ecosystem=biodiversity=2|a species whose removal dramatically changes an ecosystem=a keystone species=2|the gradual replacement of one community by another=ecological succession=2|the rate at which producers convert energy into biomass=primary productivity=1|the movement of nitrogen through the biosphere=the nitrogen cycle=1|the number of individuals per unit area=population density=3|the maximum population an environment can support=carrying capacity=3|a population curve levelling off at the carrying capacity=logistic growth=3|the average number of children per woman=the total fertility rate=3|the depletion of nutrients by repeated cropping=soil degradation=4|the enrichment of water by nutrients causing algal blooms=eutrophication=8|rain made acidic by sulfur and nitrogen oxides=acid deposition=7|the trapping of infrared radiation by atmospheric gases=the greenhouse effect=9|the thinning of stratospheric ozone by chlorofluorocarbons=ozone depletion=7|energy from a source that replenishes naturally=renewable energy=6|the increasing concentration of a toxin up a food chain=biomagnification=8|urban areas being warmer than their surroundings=the urban heat island effect=5|the practice of meeting present needs without compromising the future=sustainability=5');

  /* ---------------- ENGLISH ---------------- */

  AB('ap.lang.concept', 'In AP English Language, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the appeal to the audience\'s reason and logic=logos=1|the appeal to the speaker\'s credibility=ethos=1|the appeal to the audience\'s emotions=pathos=1|the situation, audience and purpose surrounding a text=the rhetorical situation=1|the writer\'s attitude toward the subject=tone=2|the arrangement of ideas in a text=the structure=3|a claim the writer asks the audience to accept=a thesis=2|the evidence and reasoning supporting a claim=support=4|the assumption linking evidence to a claim=a warrant=4|anticipating and addressing an opposing view=concession and refutation=5|repeating a word at the start of successive clauses=anaphora=6|balancing contrasting ideas in parallel construction=antithesis=6|a question asked for effect rather than an answer=a rhetorical question=6|deliberate understatement for effect=litotes=6|substituting a related term for the thing meant=metonymy=6|using a part to stand for the whole=synecdoche=6|placing ideas in ascending order of importance=climax=7|the repetition of a grammatical form across phrases=parallelism=7');

  AB('ap.lit.concept', 'In AP English Literature, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the perspective from which a story is told=point of view=1|a narrator whose account cannot be fully trusted=an unreliable narrator=1|the time and place of a work=the setting=1|the emotional atmosphere a work creates=mood=2|a recurring element that supports a theme=a motif=2|the central insight a work explores=the theme=2|a character who contrasts with the protagonist=a foil=3|a hint at events to come=foreshadowing=3|the moment of highest tension=the climax=3|a sudden realisation by a character=an epiphany=3|a poem of fourteen lines in iambic pentameter=a sonnet=4|the pattern of stressed and unstressed syllables=meter=4|the continuation of a sentence past the end of a line=enjambment=4|a pause within a line of verse=a caesura=4|a direct address to an absent person or abstraction=an apostrophe=5|an extended metaphor running through a whole poem=a conceit=5|a contradiction that reveals a truth=a paradox=5|two words placed together that contradict=an oxymoron=5|a reference to another work or event=an allusion=6|the repetition of vowel sounds within nearby words=assonance=4');

  /* ---------------- HISTORY & SOCIAL SCIENCE ---------------- */

  AB('ap.apush.concept', 'In AP U.S. History, what is {a}?', 'Which of these best describes {b}?', '{b} is {a}.',
    'the transatlantic movement of crops, animals and disease after 1492=the Columbian Exchange=1|the economic policy of maximising exports and colonial raw materials=mercantilism=2|the 1730s-40s religious revival across the colonies=the First Great Awakening=2|the 1776 pamphlet arguing for independence=Common Sense=3|the first US framework of government, with a weak central authority=the Articles of Confederation=3|the 1787 compromise creating a bicameral Congress=the Great Compromise=3|Jefferson\'s 1803 purchase doubling US territory=the Louisiana Purchase=4|the belief that US expansion across the continent was destined=Manifest Destiny=5|the 1820 agreement balancing free and slave states=the Missouri Compromise=4|the 1854 act letting territories vote on slavery=the Kansas-Nebraska Act=5|the 1863 order freeing enslaved people in rebelling states=the Emancipation Proclamation=5|the post-war period of rebuilding the South=Reconstruction=5|the late-1800s laws enforcing racial segregation=Jim Crow laws=6|the early-1900s reform movement against corruption and monopoly=the Progressive Era=7|Roosevelt\'s programme responding to the Great Depression=the New Deal=7|the post-1945 rivalry between the US and the Soviet Union=the Cold War=8|the policy of preventing the spread of communism=containment=8|the 1954 ruling ending school segregation=Brown v. Board of Education=8|the 1964 law banning discrimination in public accommodations=the Civil Rights Act=8');

  AB('ap.world.concept', 'In AP World History, what is {a}?', 'Which of these best describes {b}?', '{b} is {a}.',
    'the network of overland routes linking China to the Mediterranean=the Silk Roads=2|the trade network crossing the Sahara in gold and salt=the trans-Saharan trade=2|the 13th-century empire founded by Chinggis Khan=the Mongol Empire=2|the 14th-century pandemic that killed a third of Europe=the Black Death=1|the European movement reviving classical learning=the Renaissance=3|the 16th-century split in Western Christianity=the Protestant Reformation=3|the forced transport of Africans across the Atlantic=the Atlantic slave trade=4|the 18th-century movement emphasising reason and natural rights=the Enlightenment=5|the shift to mechanised factory production from about 1760=the Industrial Revolution=5|the European scramble for African territory after 1880=the New Imperialism=6|the 1919 treaty ending the First World War=the Treaty of Versailles=7|the 1917 overthrow of the Russian provisional government=the Bolshevik Revolution=7|the post-1945 process of colonies gaining independence=decolonisation=8|the movement of countries refusing Cold War alignment=the Non-Aligned Movement=8|the growing interconnection of economies after 1900=globalisation=9');

  AB('ap.humgeo.concept', 'In AP Human Geography, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the number of people per unit of arable land=physiological density=2|a map that distorts area to show a statistic=a cartogram=1|the spread of an idea from a hearth outward=expansion diffusion=3|the spread of an idea by people physically moving=relocation diffusion=3|the model describing population change as a country develops=the demographic transition model=2|the movement of people into a country=immigration=2|factors that drive people away from a place=push factors=2|a language spoken by no living community=an extinct language=3|a religion that actively seeks converts=a universalising religion=3|the process of a city\'s population growing relative to rural areas=urbanisation=6|the model of a city as rings around a central business district=the concentric zone model=6|the redevelopment of a poorer neighbourhood by wealthier arrivals=gentrification=6|the farming of a single crop over a large area=monoculture=5|agriculture producing only enough for the farmer\'s family=subsistence agriculture=5|a territory completely surrounded by another state=an enclave=4|the division of a territory along ethnic lines into hostile units=balkanisation=4|a state whose borders match a single cultural group=a nation-state=4|the theory that a country\'s development passes through fixed stages=Rostow\'s stages of growth=7');

  AB('ap.psych.concept', 'In AP Psychology, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the tendency to see an outcome as predictable after it occurs=hindsight bias=1|a testable prediction derived from a theory=a hypothesis=1|the group receiving no treatment in an experiment=the control group=1|a participant expectation effect from an inert treatment=the placebo effect=1|the gap across which neurotransmitters travel=the synapse=2|the brain structure regulating balance and coordinated movement=the cerebellum=2|the structure central to forming new long-term memories=the hippocampus=2|the structure involved in fear and emotional response=the amygdala=2|the lobe responsible for planning and judgement=the frontal lobe=2|the smallest detectable difference between two stimuli=the just noticeable difference=3|organising sensory input into meaningful patterns=perception=3|learning by pairing a neutral stimulus with a meaningful one=classical conditioning=4|learning shaped by consequences=operant conditioning=4|reinforcement delivered after an unpredictable number of responses=a variable-ratio schedule=4|learning by watching others=observational learning=4|the brief holding of sensory information=sensory memory=5|the tendency to recall the first and last items in a list=the serial position effect=5|a mental shortcut that speeds judgement but can mislead=a heuristic=6|the discomfort from holding contradictory beliefs=cognitive dissonance=8|attributing another\'s behaviour to character rather than circumstance=the fundamental attribution error=8|adjusting behaviour to match a group=conformity=8|the diffusion of responsibility when others are present=the bystander effect=8|persistent low mood and loss of interest=major depressive disorder=9|treatment based on identifying and changing distorted thinking=cognitive behavioural therapy=9');

  AB('ap.macro.concept', 'In AP Macroeconomics, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the total market value of final goods produced within a country in a year=GDP=2|GDP adjusted for price changes=real GDP=2|the sustained rise in the general price level=inflation=2|the index tracking prices of a basket bought by households=the consumer price index=2|unemployment from people moving between jobs=frictional unemployment=2|unemployment from a mismatch of skills and jobs=structural unemployment=2|unemployment caused by a downturn in the business cycle=cyclical unemployment=2|the unemployment rate when the economy is at potential output=the natural rate of unemployment=2|the extra spending generated by an initial injection=the multiplier effect=3|government use of spending and taxation to influence the economy=fiscal policy=3|central bank action on the money supply and interest rates=monetary policy=4|the rate banks charge one another for overnight loans=the federal funds rate=4|the share of deposits banks must hold=the reserve requirement=4|the curve showing the inverse short-run relation between inflation and unemployment=the Phillips curve=5|private investment crowded out by government borrowing=the crowding-out effect=5|the value of one currency in terms of another=the exchange rate=6|the ability to produce at a lower opportunity cost=comparative advantage=6');

  AB('ap.micro.concept', 'In AP Microeconomics, what is {a}?', 'Which of these best describes {b_l}?', '{b} is {a}.',
    'the value of the next best alternative given up=opportunity cost=1|the curve showing maximum output combinations=the production possibilities curve=1|the extra benefit from one more unit=marginal benefit=1|the responsiveness of quantity demanded to a price change=price elasticity of demand=2|the price above which a good cannot legally be sold=a price ceiling=2|the loss of total surplus from an inefficient outcome=deadweight loss=2|the principle that added units eventually yield less extra output=diminishing marginal returns=3|costs that do not change with output in the short run=fixed costs=3|the change in total cost from producing one more unit=marginal cost=3|a market with many firms selling an identical product=perfect competition=4|a market with a single seller and high barriers to entry=a monopoly=4|a market with a few interdependent large firms=an oligopoly=4|a monopolist charging different buyers different prices=price discrimination=4|the extra revenue from selling one more unit=marginal revenue=4|the additional output from hiring one more worker=the marginal product of labour=5|a cost or benefit falling on a third party=an externality=6|a good that is non-rival and non-excludable=a public good=6|a tax taking a larger share of income from higher earners=a progressive tax=6');

  AB('ap.gov.concept', 'In AP U.S. Government, what is {a}?', 'Which of these best describes {b}?', '{b} is {a}.',
    'the division of power between national and state governments=federalism=1|the system letting each branch limit the others=checks and balances=1|the 1803 case establishing judicial review=Marbury v. Madison=2|the power of courts to strike down unconstitutional acts=judicial review=2|the clause letting Congress act beyond its enumerated powers=the necessary and proper clause=1|the clause making federal law superior to state law=the supremacy clause=1|the clause used to regulate activity affecting interstate trade=the commerce clause=1|the essay arguing a large republic controls faction=Federalist No. 10=1|the first ten amendments=the Bill of Rights=3|the clause barring an official religion=the establishment clause=3|the amendment guaranteeing equal protection of the laws=the Fourteenth Amendment=3|the process applying the Bill of Rights to the states=selective incorporation=3|the 1963 case guaranteeing counsel to defendants=Gideon v. Wainwright=3|the drawing of district lines to favour a party=gerrymandering=5|the body that formally elects the president=the Electoral College=5|an organisation that raises money for candidates=a political action committee=5|the stated positions a party runs on=the party platform=5|a delay tactic in the Senate broken by cloture=the filibuster=2|the executive\'s rejection of a bill passed by Congress=a veto=2|the set of beliefs a person holds about government\'s role=political ideology=4');

  /* ---------------- WORLD LANGUAGES ---------------- */

  AB('ap.spanish.concept', 'In AP Spanish, {a}', 'Which sentence needs "{b}"?', 'The correct form is "{b}": {a}',
    'Espero que tú ___ (venir) mañana=vengas=1|Si yo ___ (tener) dinero, viajaría=tuviera=2|Ayer nosotros ___ (comer) a las dos=comimos=2|Cuando era niño, siempre ___ (jugar) en el parque=jugaba=2|Es importante que ella ___ (estudiar) más=estudie=1|Dudo que ellos ___ (saber) la respuesta=sepan=1|Ojalá que ___ (hacer) buen tiempo=haga=1|Para mañana ya ___ (terminar) el trabajo=habré terminado=3|Me alegro de que ustedes ___ (estar) aquí=estén=1|No creo que él ___ (ser) culpable=sea=1|Cuando ___ (llegar) ella, saldremos=llegue=3|Si hubiera sabido, yo ___ (ir)=habría ido=2');

  /* ---------------- AP COMPUTATIONAL FAMILIES ---------------- */
  const mcq = (r, correct, spread, unit) => {
    const out = [correct];
    let g = 0;
    while (out.length < 4 && g++ < 60) {
      const d = correct + (r() < 0.5 ? -1 : 1) * _int(r, 1, Math.max(1, spread));
      if (!out.includes(d)) out.push(d);
    }
    return { options: _shuf(r, out).map(String), answer: String(correct) };
  };

  C.FAMS.push({
    id: 'ap.calc.deriv', subject: 'Mathematics', band: 'h912', ap: true, unit: 2,
    make: (r, d, form) => {
      const a = _int(r, 2, 9), n = _int(r, 2, 5), b = _int(r, 1, 9), x = _int(r, 1, 4);
      const dCoef = a * n, dPow = n - 1;
      const at = dCoef * Math.pow(x, dPow) + b;
      if (form === 1) return { prompt: `If f(x) = ${a}x^${n} + ${b}x, what is f ′(${x})?`, ...mcq(r, at, Math.max(6, Math.round(at / 3))), explain: `f ′(x) = ${dCoef}x^${dPow} + ${b}; at x = ${x} this is ${at}.` };
      if (form === 2) return { prompt: `The position of a particle is s(t) = ${a}t^${n} + ${b}t. What is its velocity at t = ${x}?`, ...mcq(r, at, Math.max(6, Math.round(at / 3))), explain: `Velocity is the derivative: v(t) = ${dCoef}t^${dPow} + ${b}, so v(${x}) = ${at}.` };
      return {
        prompt: `What is the derivative of f(x) = ${a}x^${n} + ${b}x?`,
        options: _shuf(r, [`${dCoef}x^${dPow} + ${b}`, `${a * n}x^${n} + ${b}`, `${a}x^${dPow} + ${b}x`, `${dCoef}x^${n} + ${b}x`]),
        answer: `${dCoef}x^${dPow} + ${b}`,
        explain: `Power rule: bring down the exponent and reduce it by one. ${a}·${n} = ${dCoef}, giving ${dCoef}x^${dPow}, and the derivative of ${b}x is ${b}.`
      };
    }
  });

  C.FAMS.push({
    id: 'ap.calc.integral', subject: 'Mathematics', band: 'h912', ap: true, unit: 6,
    make: (r, d, form) => {
      const a = _int(r, 1, 5), n = _int(r, 1, 3), hi = _int(r, 1, 4);
      const coef = a / (n + 1);
      const val = Math.round(coef * Math.pow(hi, n + 1) * 100) / 100;
      if (form === 1) return { prompt: `What is the antiderivative of ${a}x^${n}?`, options: _shuf(r, [`(${a}/${n + 1})x^${n + 1} + C`, `${a * n}x^${n - 1} + C`, `${a}x^${n + 1} + C`, `(${a}/${n})x^${n} + C`]), answer: `(${a}/${n + 1})x^${n + 1} + C`, explain: `Raise the exponent by one and divide by the new exponent.` };
      if (form === 2) return { prompt: `The rate of flow into a tank is r(t) = ${a}t^${n} litres per minute. How much enters between t = 0 and t = ${hi}?`, ...mcq(r, val, Math.max(4, Math.round(val / 3))), explain: `Integrate: (${a}/${n + 1})·${hi}^${n + 1} = ${val} litres.` };
      return { prompt: `Evaluate ∫₀^${hi} ${a}x^${n} dx`, ...mcq(r, val, Math.max(4, Math.round(val / 3))), explain: `The antiderivative is (${a}/${n + 1})x^${n + 1}; evaluated from 0 to ${hi} this gives ${val}.` };
    }
  });

  C.FAMS.push({
    id: 'ap.calc.limit', subject: 'Mathematics', band: 'h912', ap: true, unit: 1,
    make: (r, d, form) => {
      const a = _int(r, 2, 9), b = _int(r, 1, 9);
      // lim x->a of (x^2 - a^2)/(x - a) = 2a
      if (form === 1) return { prompt: `Evaluate lim(x→∞) (${a}x² + ${b}x) / (${b}x² + ${a})`, options: _shuf(r, [`${a}/${b}`, `${b}/${a}`, '0', 'the limit does not exist']), answer: `${a}/${b}`, explain: `With equal degrees the limit is the ratio of leading coefficients: ${a}/${b}.` };
      if (form === 2) return { prompt: `For f(x) = (x² − ${a * a})/(x − ${a}), what value at x = ${a} would make f continuous?`, ...mcq(r, 2 * a, 6), explain: `The expression simplifies to x + ${a}, which approaches ${2 * a}.` };
      return { prompt: `Evaluate lim(x→${a}) (x² − ${a * a})/(x − ${a})`, ...mcq(r, 2 * a, 6), explain: `Factor the numerator as (x − ${a})(x + ${a}) and cancel; the limit is ${a} + ${a} = ${2 * a}.` };
    }
  });

  C.FAMS.push({
    id: 'ap.stats.z', subject: 'Mathematics', band: 'h912', ap: true, unit: 1,
    make: (r, d, form) => {
      const mean = _int(r, 2, 20) * 5, sd = _int(r, 2, 12), z = _pick(r, [-2, -1, 1, 2, 3]);
      const x = mean + z * sd;
      if (form === 1) return { prompt: `A distribution has mean ${mean} and standard deviation ${sd}. What value sits ${z} standard deviations from the mean?`, ...mcq(r, x, Math.max(4, sd)), explain: `${mean} + (${z})(${sd}) = ${x}.` };
      if (form === 2) return { prompt: `Under the empirical rule, roughly what percentage of a normal distribution lies within 2 standard deviations of the mean?`, options: _shuf(r, ['95%', '68%', '99.7%', '50%']), answer: '95%', explain: `The 68–95–99.7 rule: about 95% lies within two standard deviations.` };
      return { prompt: `A distribution has mean ${mean} and standard deviation ${sd}. What is the z-score of the value ${x}?`, ...mcq(r, z, 3), explain: `z = (${x} − ${mean}) / ${sd} = ${z}.` };
    }
  });

  C.FAMS.push({
    id: 'ap.stats.prob', subject: 'Mathematics', band: 'h912', ap: true, unit: 4,
    make: (r, d, form) => {
      const n = _int(r, 3, 8), p = _pick(r, [0.2, 0.25, 0.5]);
      const mean = Math.round(n * p * 100) / 100;
      if (form === 1) return { prompt: `A binomial variable has n = ${n} trials with p = ${p}. What is its mean?`, options: _shuf(r, [String(mean), String(Math.round(n * (1 - p) * 100) / 100), String(n), String(p)]), answer: String(mean), explain: `The mean of a binomial is np = ${n} × ${p} = ${mean}.` };
      if (form === 2) return { prompt: `Two events A and B are independent with P(A) = ${p} and P(B) = ${p}. What is P(A and B)?`, options: _shuf(r, [String(Math.round(p * p * 1000) / 1000), String(2 * p), String(p), String(Math.round((2 * p - p * p) * 1000) / 1000)]), answer: String(Math.round(p * p * 1000) / 1000), explain: `For independent events, multiply: ${p} × ${p} = ${Math.round(p * p * 1000) / 1000}.` };
      return { prompt: `A fair process succeeds with probability ${p} on each of ${n} independent trials. What is the expected number of successes?`, options: _shuf(r, [String(mean), String(n - mean), String(n), String(Math.round(p * 100) / 100)]), answer: String(mean), explain: `Expected value = np = ${mean}.` };
    }
  });

  C.FAMS.push({
    id: 'ap.phys.force', subject: 'Science', band: 'h912', ap: true, unit: 2,
    make: (r, d, form) => {
      const m = _int(r, 2, 25), a = _int(r, 2, 9);
      const F = m * a, v = _int(r, 2, 15), p = m * v, KE = Math.round(0.5 * m * v * v * 10) / 10;
      if (form === 1) return { prompt: `A ${m} kg object has momentum ${p} kg·m/s. What is its velocity?`, ...mcq(r, v, 6), explain: `v = p/m = ${p}/${m} = ${v} m/s.` };
      if (form === 2) return { prompt: `What is the kinetic energy of a ${m} kg object moving at ${v} m/s?`, ...mcq(r, KE, Math.max(20, Math.round(KE / 4))), explain: `KE = ½mv² = 0.5 × ${m} × ${v}² = ${KE} J.` };
      return { prompt: `What net force is needed to accelerate a ${m} kg object at ${a} m/s²?`, ...mcq(r, F, Math.max(8, Math.round(F / 4))), explain: `F = ma = ${m} × ${a} = ${F} N.` };
    }
  });

  /* ---------------- AP COURSE CATALOGUE ---------------- */
  const U = (n, title, weight) => ({ n, title, weight });

  const AP_COURSES = [
    {
      id: 'calc-ab', name: 'AP Calculus AB', group: 'Math & Computer Science', abbr: 'CalcAB',
      blurb: 'Limits, derivatives, integrals and the Fundamental Theorem, through applications.',
      banks: ['ap.calc.concept'], fams: ['ap.calc.deriv', 'ap.calc.integral', 'ap.calc.limit', 'm.h912.fn', 'm.h912.quad'],
      units: [U(1, 'Limits and Continuity', '10–12%'), U(2, 'Differentiation: Definition and Basic Rules', '10–12%'), U(3, 'Differentiation: Composite and Implicit', '9–13%'), U(4, 'Contextual Applications of Differentiation', '10–15%'), U(5, 'Analytical Applications of Differentiation', '15–18%'), U(6, 'Integration and Accumulation of Change', '17–20%'), U(7, 'Differential Equations', '6–12%'), U(8, 'Applications of Integration', '10–15%')]
    },
    {
      id: 'calc-bc', name: 'AP Calculus BC', group: 'Math & Computer Science', abbr: 'CalcBC',
      blurb: 'Everything in AB plus series, parametric and polar curves, and advanced integration.',
      banks: ['ap.calc.concept', 'ap.calcbc.concept'], fams: ['ap.calc.deriv', 'ap.calc.integral', 'ap.calc.limit', 'm.h912.seq'],
      units: [U(1, 'Limits and Continuity', '4–7%'), U(2, 'Differentiation: Definition and Basic Rules', '4–7%'), U(3, 'Differentiation: Composite and Implicit', '4–7%'), U(4, 'Contextual Applications', '6–9%'), U(5, 'Analytical Applications', '8–11%'), U(6, 'Integration and Accumulation', '17–20%'), U(7, 'Differential Equations', '6–9%'), U(8, 'Applications of Integration', '6–9%'), U(9, 'Parametric, Polar and Vector Functions', '11–12%'), U(10, 'Infinite Sequences and Series', '17–18%')]
    },
    {
      id: 'stats', name: 'AP Statistics', group: 'Math & Computer Science', abbr: 'Stats',
      blurb: 'Exploring data, designing studies, probability, and inference you can defend.',
      banks: ['ap.stats.concept'], fams: ['ap.stats.z', 'ap.stats.prob', 'm.m68.stats', 'm.h912.prob'],
      units: [U(1, 'Exploring One-Variable Data', '15–23%'), U(2, 'Exploring Two-Variable Data', '5–7%'), U(3, 'Collecting Data', '12–15%'), U(4, 'Probability, Random Variables and Distributions', '10–20%'), U(5, 'Sampling Distributions', '7–12%'), U(6, 'Inference for Categorical Data: Proportions', '12–15%'), U(7, 'Inference for Quantitative Data: Means', '10–18%'), U(8, 'Inference for Categorical Data: Chi-Square', '2–5%'), U(9, 'Inference for Quantitative Data: Slopes', '2–5%')]
    },
    {
      id: 'precalc', name: 'AP Precalculus', group: 'Math & Computer Science', abbr: 'PreCalc',
      blurb: 'Function families, trigonometry and modelling — the groundwork for calculus.',
      banks: ['ap.precalc.concept'], fams: ['m.h912.fn', 'm.h912.trig', 'm.h912.log', 'm.h912.quad', 'm.h912.seq'],
      units: [U(1, 'Polynomial and Rational Functions', '30–40%'), U(2, 'Exponential and Logarithmic Functions', '27–40%'), U(3, 'Trigonometric and Polar Functions', '30–35%'), U(4, 'Functions Involving Parameters, Vectors and Matrices', 'Not assessed on the exam')]
    },
    {
      id: 'csa', name: 'AP Computer Science A', group: 'Math & Computer Science', abbr: 'CS A',
      blurb: 'Object-oriented programming in Java: classes, arrays, inheritance, recursion, sorting.',
      banks: ['ap.csa.concept'], fams: [],
      units: [U(1, 'Primitive Types', '2.5–5%'), U(2, 'Using Objects', '5–7.5%'), U(3, 'Boolean Expressions and if Statements', '15–17.5%'), U(4, 'Iteration', '17.5–22.5%'), U(5, 'Writing Classes', '5–7.5%'), U(6, 'Array', '10–15%'), U(7, 'ArrayList', '2.5–7.5%'), U(8, '2D Array', '7.5–10%'), U(9, 'Inheritance', '5–10%'), U(10, 'Recursion', '5–7.5%')]
    },
    {
      id: 'csp', name: 'AP Computer Science Principles', group: 'Math & Computer Science', abbr: 'CSP',
      blurb: 'How computing works and what it does to society — algorithms, data, the internet, impact.',
      banks: ['ap.csp.concept'], fams: [],
      units: [U(1, 'Creative Development', '10–13%'), U(2, 'Data', '17–22%'), U(3, 'Algorithms and Programming', '30–35%'), U(4, 'Computer Systems and Networks', '11–15%'), U(5, 'Impact of Computing', '21–26%')]
    },
    {
      id: 'bio', name: 'AP Biology', group: 'Sciences', abbr: 'Bio',
      blurb: 'From the chemistry of life to genetics, evolution and ecological systems.',
      banks: ['ap.bio.concept', 'sci.h912.bio'], fams: ['s.h912.punnett'],
      units: [U(1, 'Chemistry of Life', '8–11%'), U(2, 'Cell Structure and Function', '10–13%'), U(3, 'Cellular Energetics', '12–16%'), U(4, 'Cell Communication and Cell Cycle', '10–15%'), U(5, 'Heredity', '8–11%'), U(6, 'Gene Expression and Regulation', '12–16%'), U(7, 'Natural Selection', '13–20%'), U(8, 'Ecology', '10–15%')]
    },
    {
      id: 'chem', name: 'AP Chemistry', group: 'Sciences', abbr: 'Chem',
      blurb: 'Atomic structure through kinetics, equilibrium, acids and bases, and thermodynamics.',
      banks: ['ap.chem.concept', 'sci.h912.chem'], fams: ['s.h912.mole'],
      units: [U(1, 'Atomic Structure and Properties', '7–9%'), U(2, 'Compound Structure and Properties', '7–9%'), U(3, 'Properties of Substances and Mixtures', '18–22%'), U(4, 'Chemical Reactions', '7–9%'), U(5, 'Kinetics', '7–9%'), U(6, 'Thermodynamics', '7–9%'), U(7, 'Equilibrium', '7–9%'), U(8, 'Acids and Bases', '11–15%'), U(9, 'Applications of Thermodynamics', '7–9%')]
    },
    {
      id: 'phys1', name: 'AP Physics 1', group: 'Sciences', abbr: 'Phys 1',
      blurb: 'Algebra-based mechanics: kinematics, forces, energy, momentum, rotation and waves.',
      banks: ['ap.phys.concept', 'sci.h912.phys'], fams: ['ap.phys.force', 's.h912.kin'],
      units: [U(1, 'Kinematics', '10–16%'), U(2, 'Force and Translational Dynamics', '14–20%'), U(3, 'Work, Energy and Power', '15–24%'), U(4, 'Linear Momentum', '10–16%'), U(5, 'Torque and Rotational Dynamics', '10–16%'), U(6, 'Energy and Momentum of Rotating Systems', '5–11%'), U(7, 'Oscillations', '6–12%')]
    },
    {
      id: 'envsci', name: 'AP Environmental Science', group: 'Sciences', abbr: 'APES',
      blurb: 'Ecosystems, populations, resources, pollution and the systems behind climate change.',
      banks: ['ap.envsci.concept', 'sci.h912.earth'], fams: [],
      units: [U(1, 'The Living World: Ecosystems', '6–8%'), U(2, 'The Living World: Biodiversity', '6–8%'), U(3, 'Populations', '10–15%'), U(4, 'Earth Systems and Resources', '10–15%'), U(5, 'Land and Water Use', '10–15%'), U(6, 'Energy Resources and Consumption', '10–15%'), U(7, 'Atmospheric Pollution', '7–10%'), U(8, 'Aquatic and Terrestrial Pollution', '7–10%'), U(9, 'Global Change', '15–20%')]
    },
    {
      id: 'lang', name: 'AP English Language', group: 'English', abbr: 'Lang',
      blurb: 'Rhetoric in non-fiction: how arguments are built, and how to build your own.',
      banks: ['ap.lang.concept', 'ela.h912.device', 'ela.h912.grammar'], fams: [],
      units: [U(1, 'Rhetorical Situation: Reading', '11–14%'), U(2, 'Rhetorical Situation: Writing', '11–14%'), U(3, 'Claims and Evidence: Reading', '11–14%'), U(4, 'Claims and Evidence: Writing', '11–14%'), U(5, 'Reasoning and Organisation: Reading', '11–14%'), U(6, 'Reasoning and Organisation: Writing', '11–14%'), U(7, 'Style: Reading', '11–14%'), U(8, 'Style: Writing', '11–14%')]
    },
    {
      id: 'lit', name: 'AP English Literature', group: 'English', abbr: 'Lit',
      blurb: 'Close reading of fiction, poetry and drama, and writing arguments about them.',
      banks: ['ap.lit.concept', 'ela.h912.vocab'], fams: [],
      units: [U(1, 'Short Fiction I', '42–49% (prose overall)'), U(2, 'Poetry I', '36–45% (poetry overall)'), U(3, 'Longer Fiction or Drama I', '15–18%'), U(4, 'Short Fiction II', '—'), U(5, 'Poetry II', '—'), U(6, 'Longer Fiction or Drama II', '—'), U(7, 'Short Fiction III', '—'), U(8, 'Poetry III', '—'), U(9, 'Longer Fiction or Drama III', '—')]
    },
    {
      id: 'apush', name: 'AP U.S. History', group: 'History & Social Science', abbr: 'APUSH',
      blurb: '1491 to the present, through evidence, causation and argument.',
      banks: ['ap.apush.concept', 'gk.h912.doc'], fams: [],
      units: [U(1, 'Period 1: 1491–1607', '4–6%'), U(2, 'Period 2: 1607–1754', '6–8%'), U(3, 'Period 3: 1754–1800', '10–17%'), U(4, 'Period 4: 1800–1848', '10–17%'), U(5, 'Period 5: 1844–1877', '10–17%'), U(6, 'Period 6: 1865–1898', '10–17%'), U(7, 'Period 7: 1890–1945', '10–17%'), U(8, 'Period 8: 1945–1980', '10–17%'), U(9, 'Period 9: 1980–present', '4–6%')]
    },
    {
      id: 'world', name: 'AP World History: Modern', group: 'History & Social Science', abbr: 'WHAP',
      blurb: 'c. 1200 to the present across every region, comparing change and continuity.',
      banks: ['ap.world.concept'], fams: [],
      units: [U(1, 'The Global Tapestry, c.1200–1450', '8–10%'), U(2, 'Networks of Exchange, c.1200–1450', '8–10%'), U(3, 'Land-Based Empires, c.1450–1750', '12–15%'), U(4, 'Transoceanic Interconnections, c.1450–1750', '12–15%'), U(5, 'Revolutions, c.1750–1900', '12–15%'), U(6, 'Consequences of Industrialisation, c.1750–1900', '12–15%'), U(7, 'Global Conflict, c.1900–present', '8–10%'), U(8, 'Cold War and Decolonisation', '8–10%'), U(9, 'Globalisation, c.1900–present', '8–10%')]
    },
    {
      id: 'humgeo', name: 'AP Human Geography', group: 'History & Social Science', abbr: 'HuG',
      blurb: 'How people organise space — population, culture, cities, agriculture, development.',
      banks: ['ap.humgeo.concept'], fams: [],
      units: [U(1, 'Thinking Geographically', '8–10%'), U(2, 'Population and Migration', '12–17%'), U(3, 'Cultural Patterns and Processes', '12–17%'), U(4, 'Political Patterns and Processes', '12–17%'), U(5, 'Agriculture and Rural Land Use', '12–17%'), U(6, 'Cities and Urban Land Use', '12–17%'), U(7, 'Industrial and Economic Development', '12–17%')]
    },
    {
      id: 'psych', name: 'AP Psychology', group: 'History & Social Science', abbr: 'Psych',
      blurb: 'Biology of behaviour, cognition, development, social psychology and mental health.',
      banks: ['ap.psych.concept'], fams: [],
      units: [U(1, 'Scientific Foundations of Psychology', '10–14%'), U(2, 'Biological Bases of Behaviour', '8–10%'), U(3, 'Sensation and Perception', '6–8%'), U(4, 'Learning', '7–9%'), U(5, 'Cognitive Psychology', '13–17%'), U(6, 'Developmental Psychology', '7–9%'), U(7, 'Motivation, Emotion and Personality', '11–15%'), U(8, 'Social Psychology', '8–10%'), U(9, 'Clinical Psychology', '12–16%')]
    },
    {
      id: 'macro', name: 'AP Macroeconomics', group: 'History & Social Science', abbr: 'Macro',
      blurb: 'National income, inflation, unemployment, and the policy levers that move them.',
      banks: ['ap.macro.concept', 'gk.h912.econ'], fams: [],
      units: [U(1, 'Basic Economic Concepts', '5–10%'), U(2, 'Economic Indicators and the Business Cycle', '12–17%'), U(3, 'National Income and Price Determination', '17–27%'), U(4, 'Financial Sector', '18–23%'), U(5, 'Long-Run Consequences of Stabilisation Policies', '20–30%'), U(6, 'Open Economy: International Trade and Finance', '10–13%')]
    },
    {
      id: 'micro', name: 'AP Microeconomics', group: 'History & Social Science', abbr: 'Micro',
      blurb: 'Scarcity, markets, firm behaviour, factor markets and market failure.',
      banks: ['ap.micro.concept'], fams: [],
      units: [U(1, 'Basic Economic Concepts', '12–15%'), U(2, 'Supply and Demand', '20–25%'), U(3, 'Production, Cost and the Perfect Competition Model', '22–25%'), U(4, 'Imperfect Competition', '15–22%'), U(5, 'Factor Markets', '10–13%'), U(6, 'Market Failure and the Role of Government', '8–13%')]
    },
    {
      id: 'gov', name: 'AP U.S. Government and Politics', group: 'History & Social Science', abbr: 'Gov',
      blurb: 'Constitutional foundations, civil liberties, political behaviour and institutions.',
      banks: ['ap.gov.concept', 'gk.m68.branch', 'gk.h912.doc'], fams: [],
      units: [U(1, 'Foundations of American Democracy', '15–22%'), U(2, 'Interactions Among Branches of Government', '25–36%'), U(3, 'Civil Liberties and Civil Rights', '13–18%'), U(4, 'American Political Ideologies and Beliefs', '10–15%'), U(5, 'Political Participation', '20–27%')]
    },
    {
      id: 'spanish', name: 'AP Spanish Language and Culture', group: 'World Languages', abbr: 'Spanish',
      blurb: 'Interpretive, interpersonal and presentational communication across six themes.',
      banks: ['ap.spanish.concept', 'lang.h912.estense', 'lang.h912.idiom'], fams: [],
      units: [U(1, 'Families in Different Societies', '~17%'), U(2, 'The Influence of Language and Culture on Identity', '~17%'), U(3, 'Influences of Beauty and Art', '~17%'), U(4, 'How Science and Technology Affect Our Lives', '~17%'), U(5, 'Factors That Impact the Quality of Life', '~17%'), U(6, 'Environmental, Political and Societal Challenges', '~17%')]
    }
  ];

  const AP_GROUPS = ['Math & Computer Science', 'Sciences', 'English', 'History & Social Science', 'World Languages'];

  /* AP score projection. Composite cut points vary by subject and year; these are
     broad approximations used to give directional feedback, never a prediction. */
  function projectScore(pct) {
    if (pct >= 72) return 5;
    if (pct >= 58) return 4;
    if (pct >= 42) return 3;
    if (pct >= 28) return 2;
    return 1;
  }
  const SCORE_LABEL = {
    5: 'Extremely well qualified',
    4: 'Well qualified',
    3: 'Qualified',
    2: 'Possibly qualified',
    1: 'No recommendation'
  };

  window.QQ_AP = { AP_COURSES, AP_GROUPS, projectScore, SCORE_LABEL };
})();
