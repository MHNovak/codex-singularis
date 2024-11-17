// debug
const online = true;
const version = '0.6.3';
const prevVersion = '0.6.2';

// globals
const dataPath = document.location.origin+"/assets/data";

// const wh40kURI = "assets/data-json/Warhammer 40,000.gst.json";
// const wh40kIndex = "assets/data-json/fileIndex.json";
// popular game systems
const popGst = ['wh40k','wh40k-killteam','warhammer-age-of-sigmar','horus-heresy','gaslands','aeronautica-imperialis'];//'adeptus-titanicus','whfb'];
const galleryPath = document.location.origin+'/assets/data/catpkg-gallery.json';
// const testDataPath = 'https://github.com/BSData/wh40k/releases/download/v9.7.11/wh40k.v9.7.11.bsr';
var galleryData;

var fileIndex;
var catalogueData = {prom:[]};
var gameSystem;
var roster;

const ignoreTags = ['xmlns','battleScribeVersion','readme','comment','catalogueLinks'];
const headerTags = ["id","name","revision","authorName","authorContact","authorUrl","library","gameSystemId","gameSystemRevision"];
const baseTags = ['costTypes', 'profileTypes', 'characteristicTypes', 'rules', 'infoLinks', 'costLimits', 'publications', 'forceEntries', 'categoryEntries']; // categoryEntries have to be stored in two places
// const internalTags = ['modifiers', 'conditions', 'repeats', 'constraints', 'conditionGroups', 'categoryLinks', 'profiles', 'characteristics', 'costs', 'selectionEntryGroups', 'modifierGroups', 'categories', 'infoGroups'];
const sharedTags = ['sharedSelectionEntries', 'sharedSelectionEntryGroups', 'sharedRules', 'sharedProfiles', 'sharedInfoGroups', 'categoryEntries'];
const rootSelectionTags = ['entryLinks','selectionEntries'];
// XML tags
const arrayTagList = ['publications', 'costTypes', 'profileTypes', 'characteristicTypes', 'categoryEntries', 'modifiers', 'conditions', 'repeats', 'constraints', 'conditionGroups', 'forceEntries', 'categoryLinks', 'rules', 'entryLinks', 'sharedSelectionEntries', 'profiles', 'characteristics', 'selectionEntries', 'costs', 'infoLinks', 'selectionEntryGroups', 'modifierGroups', 'sharedSelectionEntryGroups', 'sharedRules', 'sharedProfiles', 'catalogueLinks', 'forces', 'selections', 'categories', 'costLimits', 'sharedInfoGroups', 'infoGroups'];
const orphanTagList = ['readme','description','comment'];

const upgradeIcon = 'bi-text-left'; // bi-text-left / bi-filter-left
const unitIcon = 'bi-people-fill';
const modelIcon = 'bi-person-fill';
const errorSumIcon = 'bi-exclamation-diamond-fill';
const errorIcon = 'bi-exclamation-diamond';
const returnIcon = 'bi-arrow-left';
const uiIcons = {
	'bi-caret-right-fill': 'collapse',
	'bi-caret-down-fill': 'collapse',
	'bi-x-lg': 'remove',
	'bi-info-circle': 'info',
	'bi-plus-lg': 'add',
};
const maxIndent = 5;	// defined by css

// const linkType = {selectionEntry:"sharedSelectionEntries",selectionEntryGroup:"sharedSelectionEntryGroups",rule:,profile:,infoGroup:};
var selectionQueue = [];
var rightPanelEntry = {}; // roster entry being shown in right panel
var display;
var missingLinks = {};
var importFlag; // flag when importing roster
var importProms;

// initialize variables
function resetGlobals(){
	gameSystem = {name:""};
	roster = { name:'New Roster',game:'',forces:{},conditions:{} };
	display = {left:{},center:{},errors:{}};
	importFlag = false;
	importProms = [];
}


// Register events
document.addEventListener('DOMContentLoaded', immediateActions, false);
window.onload = windowLoadActions;

// Runs immediately on load
function immediateActions(){
	console.log('page load success v'+version);
	// set starting values
	resetGlobals();
	// console.log(roster);
	// getData(wh40kURI,setRules);
	
	// link buttons to click handlers
	// several handled in basic function
	["blankRosBtn","gameSelectBtn","cancelNewRosBtn","importRosBtn","cancelImportBtn","importBtn"]
		.forEach(elem => 
		document.getElementById(elem).addEventListener('click',configureRoster));
	
	document.getElementById("rosterAddForce").addEventListener('click',showAddForce);
	document.getElementById("submitForceBtn").addEventListener('click',submitForceClick);
	document.getElementById("cancelForceBtn").addEventListener('click',cancelForce);
	// document.getElementById("importBtn").addEventListener('click',importRoster);
	
	// set input listeners
	document.getElementById("gameSelect").addEventListener('input',gameSelected);
	document.getElementById("rosterName").addEventListener('input',gameSelected);
	document.getElementById("forceFaction").addEventListener('input',validateForceForm);
	document.getElementById("forceType").addEventListener('input',validateForceForm);
	// pre-fetch roster imports as soon as file selected
	document.getElementById("fileUpload").addEventListener("change",importRoster);
	
	// make roster headers clickable
	document.getElementById("CP:header").addEventListener('click', itemClick);
	document.getElementById("LP:header").addEventListener('click', itemClick);
	
	// RP change handler
	document.getElementById("rp-formarea").addEventListener('change',processRpForm);
	
	// mobile buttons
	document.getElementById("LP-return").addEventListener('click',()=>switchMobileView('cp'));
	document.getElementById("RP-return").addEventListener('click',()=>switchMobileView('cp'));
	document.getElementById("rosterAddUnit").addEventListener('click',()=>switchMobileView('lp'));
	
	// fetch the latest gamesystem links
	if(online){
		makeGameMenu();
	}
	
}

// Runs slightly after DOM event
function windowLoadActions(){
	window.addEventListener('resize', resizeHandler);
	// insert an invisible icon, to force the font package to load
	show("i-inv");
}



// -------------  SITE BEHAVIOR  ------------------
// handle screen size changes
function resizeHandler(){
	
}

// push a panel into view (mobile only)
function switchMobileView(setView){
	// hide everything (gets overridden by d-md-block)
	// hide("lp");
	// hide("cp");
	// hide("rp");
	
	// show the desired view
	// show(setView);
	
	// hide LP/RP
	document.getElementById("lp").classList.add('slide-off');
	document.getElementById("rp").classList.add('slide-off');
	
	// show selected
	document.getElementById(setView).classList.remove('slide-off');
	
}

// handle various basic config clicks
function configureRoster(event){
	
	const target = event.target.id;
	
	// create new roster
	if(target === 'blankRosBtn'){
		hide("newOrImportForm");
		show("gameSelectForm");
		
	}else if(target === "cancelNewRosBtn"){
		show("newOrImportForm");
		hide("gameSelectForm");
		// clear any pre-fetch data
		resetGlobals();
		
	}else if(target === "gameSelectBtn"){
		// show the main editor panels
		hide("gameSelectForm");
		show("LP-inner-header");
		show("CP-inner-header");
		// show hint text
		show("addForceInitial");
		// set the CP main title
		document.getElementById("CP-header-title").innerText = roster.name;
	
	// import a roster
	}else if(target === "importRosBtn"){
		hide("newOrImportForm");
		show("rosUploadForm");
		
	// cancel importing a roster
	}else if(target === "cancelImportBtn"){
		show("newOrImportForm");
		hide("rosUploadForm");
		// clear any pre-fetch data
		resetGlobals();
		// clear the selected file
		document.getElementById("rosUploadForm").reset();
		// disable the continue button
		document.getElementById("importBtn").disabled = true;
		
	// commit roster impotr
	}else if(target === "importBtn"){
		// check if a file exists
		let f = document.getElementById("fileUpload");
		
		if(f.files.length > 0){
			// show the editor panels
			hide("rosUploadForm");
			show("LP-inner-header");
			show("CP-inner-header");
			
			// set the right panel entry to be the roster
			rightPanelEntry = roster;
			
			// cue a display update once done importing
			// track excess wait time to finish import
			console.time('import-finish');
			Promise.all(importProms).then(()=>{
				fullDisplayUpdate();
				console.timeEnd('import-finish');
			});
		}
		
	}
	
}

// Generate the game selection drop-down menu
async function makeGameMenu(){
	
	// fetch the gallery data file
	galleryData = await getJsonData(galleryPath);
	
	// prep the html string
	let optStr = '<option selected value="unselected">Available games..</option>';
	
	// extract the latest data link for each game system
	popGst.forEach(game => {
		
		// find that entry in the gallery
		const galEntry = galleryData.repositories.filter(r => r.name === game)[0];
		
		if(galEntry && galEntry.gamesystemData){
			// list all versions of the game
			galEntry.gamesystemData.forEach(gamedata => {
				
				// embed both the repo and gst id
				let optVal = galEntry.name +'/'+gamedata.id;
				// add an option for this repo to the menu
				optStr += '<option value="'+optVal+'">'+gamedata.name+'</option>';
				
			});
		}else{
			console.log('Didnt find '+game+' in gallery');
		}
	
	});
	
	// set the gamesystem options
	const gameSelectElem = document.getElementById("gameSelect");
	gameSelectElem.innerHTML = optStr;
	
	
}

// Process game system selection; validate form and pre-fetch gst data
async function gameSelected(){
	
	// hide the pre-load invisible icon
	hide("i-inv");
	
	let gameSelection = document.getElementById("gameSelect").value;
	
	// extract repo and gst
	const repo = gameSelection.split('/')[0];
	const gstid = gameSelection.split('/')[1];
	
	// if selected a new system
	if(gstid !== roster.game && gameSelection !== "unselected"){
		
		// set the game system
		roster.game = gstid;
		roster.repo = repo;
		
		// attmept to not break the working system
		if(online){
			
			// its entry in the gallery
			const galEntry = galleryData.repositories.filter(r => r.name === repo)[0];
			// the subentry for the gst
			const gameSubentry = galEntry.gamesystemData.filter(g => g.id === gstid)[0];
			
			// game system changed, fetch rules and file index
			fileIndex = getJsonData([dataPath,repo,'fileIndex.json'].join('/'));
			
			// promise, don't wait for game system data yet
			console.time('gst-data');
			gameSystem = getXmlData([dataPath,repo,gameSubentry.filename].join('/'));
			gameSystem.then(()=>console.timeEnd('gst-data'));
			
			// update the summary text
			document.getElementById("LP-header-title").textContent = gameSubentry.name;
			document.getElementById("LP-header-subtitle").textContent = ' - v'+gameSubentry.rev;
			
			
		}else{  // old system
			// game system changed, fetch rules and file index
			gameSystem = await getJsonData(wh40kURI);
			fileIndex = await getJsonData(wh40kIndex);
			
			// update the summary text
			document.getElementById("LP-header-title").textContent = gameSystem.name;
			document.getElementById("LP-header-subtitle").textContent = ' - v'+gameSystem.revision;
		}
		
	}
	
	// store the roster name
	let nameInput = document.getElementById("rosterName");
	if(nameInput.value || 0){
		roster.name = nameInput.value;
	
	}else{
		// reset name if none input
		roster.name = "New Roster";
	}
	
	// and enable the 'continue' button
	let btn = document.getElementById("gameSelectBtn");
	if(gameSelection !== "unselected"){
		btn.disabled = false;
	}else{
		btn.disabled = true;
	}
	
}

// re-show the game system selection menu
function changeGameSystem(){
	show("gameSelectForm");
	hide("gameSummary");
	// add the cancel option
	show("cancelGameSys");
}

// show force input form
async function showAddForce(e){
	e.preventDefault();
	
	hide("addForceInitial");
	hide("left-menu");
	show("addForceForm");
	// hide gamesystem select form if mid change
	hide("gameSelectForm");
	// allow 'add force' button to collapse
	document.getElementById("rosterAddForce").classList.remove('force-open');
	document.getElementById("addForceHint").classList.remove('force-open');
	
	// Force type handled in updateForceForm
	
	// populate Force factions menu
	let factionOptions = '<option value="-1">Select faction..</option>';
	// check if the roster already has any factions
	const hasFaction = Object.values(roster.forces).length > 0;
	let lastFaction;
	if(hasFaction){
		const allForces = Object.values(roster.forces);
		lastFaction = allForces[allForces.length-1].catalogue.id;
	}
	
	if(online){
		// wait here for promise to resolve
		fileIndex = await fileIndex;
		
		// find all non-library and non-gst catalogues
		const factList = Object.values(fileIndex).filter(cat => cat.gst == roster.game && !cat.isLibrary);
		// sort alphabetically
		factList.sort(sortByName);
		// make a selection option for each
		factList.forEach(cat => {
			factionOptions += '<option value="'+cat.id+'"';
			// inject the last selected faction
			if(hasFaction && cat.id === lastFaction){
				factionOptions += ' selected';
			}
			factionOptions += '>'+cat.name+'</option>';
		});
		
	}else{
		// old fallback
		for(let k=0; k<fileIndex.length; k++){
			if(fileIndex[k].isLibrary !== 'true')
				factionOptions += '<option value="'+k+'">'
						+fileIndex[k].name.split('.cat')[0]+'</option>';
		}
	}
	
	document.getElementById("forceFaction").innerHTML = factionOptions;
	
	updateForceForm();
}

// when scope selected, may need to update force type options
async function updateForceForm(){
	// let forceScope = document.getElementById("forceScope").value;
	const forceScope = 'Roster';
	
	// construct Force type options
	let typeOptions = '<option selected>Select type..</option>';
	// display initially
	document.getElementById("forceType").innerHTML = typeOptions;
	
	// handle child forces case
	if(forceScope !== 'Roster'){
		let parentForce = roster.forces.filter(force => force.id === forceScope)[0];
		let childForces = parentForce.gstLink.forceEntries;
		childForces.forEach(force => {
			if(force.hidden !== 'true')
				typeOptions += '<option value="'+force.id+'">'+force.name+'</option>';
		});
		
	}else{
		// wait here for the gamesystem promise to resolve
		gameSystem = await gameSystem;
		
		// construct standard Force type options
		gameSystem.forceEntries.forEach(force => {
			// make a default name if force name is empty
			if(force.name.split(/\s*/).join('').length === 0)
				force.name = 'Default';
			// if(force.hidden !== 'true')  // ignore hidden forces for now
			typeOptions += '<option value="'+force.id+'">'+force.name+'</option>';
		});
	}
	
	// display result
	document.getElementById("forceType").innerHTML = typeOptions;
	// validate result
	validateForceForm();
}

// decide whether force form can be submitted
function validateForceForm(){
	let formBtn = document.getElementById("submitForceBtn");
	let forceType = document.getElementById("forceType").value;
	let forceFaction = document.getElementById("forceFaction").value;
	
	// pre-fetch catalogue data on selection
	if(online && forceFaction !== '-1'){
		
		// copy in precompiled import list
		fileIndex[forceFaction].fullImport.forEach(importItem => {
			
			let linkid = importItem.id;
			
			// check that not a repeat
			if(!(linkid in catalogueData)){
				
				// initiate the download and store a copy, track the promise
				catalogueData.prom.push(
					getStringData([dataPath,roster.repo,fileIndex[linkid].filename].join('/'))
					.then(str => {
						// parse the xml to JSON, then store JSON str
						catalogueData[linkid] = JSON.stringify(xmlStrToJson(str));
					})
					.catch(console.log)
				);
				
			}
		});
	}
	
	// validate that both faction and type have been selected
	if(forceType !== 'Select type..' && forceFaction !== '-1'){
		formBtn.disabled = false;
	
	}else{
		formBtn.disabled = true;
	}
}

// cancel force form submission
function cancelForce(e){
	e.preventDefault();
	
	hide("addForceForm");
	show("left-menu");
	
	
	// if no forces, show the hint text
	if(Object.keys(roster.forces).length === 0){
		show("addForceInitial");
		// reinflate 'add force' button
		document.getElementById("rosterAddForce").classList.add('force-open');
		document.getElementById("addForceHint").classList.add('force-open');
	}else{
		// if some forces, on mobile cut back to CP
		switchMobileView('cp');
	}
}

// add the force (visual handlers)
async function submitForceClick(e){
	
	e.preventDefault();
	
	// timer info
	console.time('submitForce');
	
	// show("forceSummary");
	hide("addForceForm");
	show("left-menu");
	
	// selection info
	let params = {};
	
	// const forceScope = document.getElementById("forceScope").value;
	params.scope = 'Roster';
	params.forceType = document.getElementById("forceType").value;
	// let forceTypeName = document.getElementById("forceType").innerText;
	params.factionInd = document.getElementById("forceFaction").value;
	if(!online){
		params.factionInd = parseInt(params.factionInd);
	}
	
	// pass in collected params
	let newForceId = await submitForce(params,true);
	
	
	// update editor display
	fullDisplayUpdate();
	// show CP if on mobile
	switchMobileView('cp');
	// hereafter show the LP return arrow
	show("LP-return");
	
	console.timeEnd('submitForce');
	
	// let the page render before continuing
	await yieldToMain();
	
	// slow search any missing links; pass fid to prevent repeating an old search
	fillMissingLinks(newForceId);
	
}

// add force (programmatically)
async function submitForce(params,runAutoSelect){
	
	// expecting parameters of form:
	/* { 
		scope: str, typically 'Roster', unless a child force
		forceType: entryId of the force gst entry
		factionInd: catalogue id of the primary catalogue (faction)
	} */
	 
	const factionInd = params.factionInd;
	const factionName = fileIndex[factionInd].name;
	
	// prepare force entry
	const newForceId = makeid(6);
	let newForceObj = {
		id: newForceId,
		name: "",
		typeId: params.forceType,
		collapse: false,
		forces: {},
		selections: {},
		conditions: {},
		modifiers: {},
	};
	let rosterScope = roster;
	let gstParent = gameSystem;

	// handle child force
	if(params.scope !== 'Roster'){
		// for now, only check first children
		// rosterScope = roster.forces.filter(force => force.id === params.scope)[0];
		rosterScope = roster.forces[params.scope];
		gstParent = rosterScope.gstLink;	
	}
	// link to rule system
	let thisForceEntry = gstParent.forceEntries.filter(force => force.id === params.forceType)[0];
	newForceObj.gstLink = thisForceEntry;
	newForceObj.name = thisForceEntry.name;
	// add the force
	rosterScope.forces[newForceId] = newForceObj;
	
	// prep display state
	display.left[newForceId] = {collapse: false};
	display.center[newForceId] = {collapse: false};
	
	// collapse all but the new force
	for(const fid in roster.forces){
		roster.forces[fid].collapse = true;
		display.left[fid].collapse = true;
	}
	newForceObj.collapse = false;
	display.left[newForceId].collapse = false;
	
	// default ungategorized bucket
	display.left[newForceId].uncategorized = {collapse: true};
	display.center[newForceId].uncategorized = {collapse: true};
	// add categories to display object
	if(newForceObj.gstLink.categoryLinks){
		newForceObj.gstLink.categoryLinks.forEach(ctg => {
			display.left[newForceId][ctg.targetId] = {collapse: true};
			display.center[newForceId][ctg.targetId] = {collapse: false};
		});
		// expand the first ctg
		display.left[newForceId][newForceObj.gstLink.categoryLinks[0].targetId].collapse = false;
	}
	
	
	
	// ------- compilation steps -----------
	try{
		// compile the catalogue
		newForceObj.catalogue = await compileCatalogue(factionInd,newForceObj);
		
		// emit the added force, before compiling own constraints
		emitConstraints(newForceObj,1);
		
		// compile roster and force constraints
		compileForceConstraints(newForceId,true);
		
		// evaluate modifiers
		compileForceModifiers(newForceId);
		
		// auto-selections
		if(runAutoSelect)
			autoSelect({scope:'force',rosLink:newForceObj});
		
	}catch(err){console.log(err);}
	
	// note, need to call fillMissingLinks(newForceId) outside this function
	
	// return an fid reference
	return newForceId;
}

// refresh all three panels, update costs, collect errors
function fullDisplayUpdate(){
	
	// update costs
	updateRosterCosts();
	
	// todo collect errors
	
	// update the display
	updateLeftPanel();
	updateCenterPanel();
	updateRightPanel();
	
}

// refresh the left editor panel
function updateLeftPanel(){
	
	// console.time('updateLeft');
	
	let listParent = document.getElementById("left-menu");
	
	// build in temporary fragment, faster
	let mainList = document.createDocumentFragment();
	
	// clear the current lists
	listParent.replaceChildren();
	
	// show all forces
	// TODO handle child forces
	for(const fid in roster.forces){
		const force = roster.forces[fid];
		// basic configuration
		let params = {
			collapsable: true,
			collapse: display.left[fid].collapse,
			title: force.catalogue.name,
			subtitle: getModifiedName(force.gstLink,force),
			id: 'LP:'+force.id,
			classes: ['force']
		};
		// capture the new list root
		let forceSubList = addToList(mainList,params);
		
		// if collapsed, move on to next force
		if(display.left[fid].collapse)
			continue;
		
		
		// temporary organization object; always include 'uncategorized'
		let ctgLists = {
			uncategorized: {
					name: 'Uncategorized',
					entries: []
				}
		};
		// prep all prime categories (respecting mods)
		(force.gstLink.categoryLinks ?? []).forEach(category => {
			
			// is it hidden
			const isHidden = getModifiedHidden(category,force);
			// has it reached its max
			const isMax = checkMax(category,fid);
			
			if(!isHidden && !isMax){
				ctgLists[category.targetId] = {
					name: getModifiedName(category,force),
					entries: []
				};
			}
		});
		
		// add entries to their category lists
		for(const entryId in force.catalogue.root){
			
			const entry = force.catalogue.root[entryId];
			// is it hidden
			const isHidden = getModifiedHidden(entry,force);
			// has it reached its max
			const isMax = checkMax(entry,fid);
			// whats the prime ctg to sort under
			const primeCtg = getModifiedPrimeCtg(entry,force);
			
			// if has a prime category, add to that list
			if(primeCtg && (primeCtg in ctgLists) && !isHidden && !isMax){
				ctgLists[primeCtg].entries.push(entry);
			}
		}
		// console.log(ctgLists);
		
		// now loop and display categories and entries
		for(const ctgid in ctgLists){
			const catIndent = 1;
			const category = ctgLists[ctgid];
			const catParams = {
				id: 'LP:'+fid+':'+ctgid,
				collapsable: true,
				collapse: display.left[fid][ctgid].collapse,
				title: category.name,
				classes: ['category','indent-'+catIndent]
			};
			if(category.entries.length > 0){
				// add and save list root reference
				let catSubList = addToList(forceSubList,catParams);
				
				// show all the root selection entries
				category.entries.forEach(entry => {
					//determine entry type
					let eType = 'none';
					if(exists(entry.type))
						eType = entry.type;
					// if a link, get the linked type
					if(eType === 'selectionEntry')
						eType = entry.link.type;
					// map to desired icon
					let typeIcon = upgradeIcon;
					if(eType === 'unit'){
						typeIcon = unitIcon;
					}else if(eType === 'model'){
						typeIcon = modelIcon;
					}
					// item indent is parent+1, up to max
					// const itemIndent = catIndent >= maxIndent ? catIndent : catIndent+1;
					const itemIndent = catIndent;
					
					// configure item params
					const itemParam = {
						title: getModifiedName(entry,force),
						id: fid+':'+entry.id,
						icons: [
						// {
							// type: 'bi-info-circle',
							// click: showInfo
						// },
						{
							type: 'bi-plus-lg',
							click: selectUnitClick
						}],
						iconL: typeIcon,
						classes: ['indent-'+itemIndent]
					};
					// add to list
					addToList(catSubList,itemParam);
				});
			} // if category has entries
		} // for ctgList
	} // for forces
	
	// apply the changes
	listParent.appendChild(mainList);
	
	// if there were no forces, show starting text
	if(Object.keys(roster.forces).length === 0){
		show("addForceInitial");
		// reinflate 'add force' button
		document.getElementById("rosterAddForce").classList.add('force-open');
		document.getElementById("addForceHint").classList.add('force-open');
	}
	
	// console.timeEnd('updateLeft');
}

// refresh center panel
function updateCenterPanel(){
	
	// Show all the forces
	let listHolder = document.getElementById("center-menu");
	
	// work in a temp fragment
	let mainList = document.createDocumentFragment();
	
	// clear the current lists
	listHolder.replaceChildren();
	
	// TODO handle child forces
	for(const fid in roster.forces){
		const force = roster.forces[fid];
		// track indentation
		let indent = 0;
		
		// basic configuration
		const params = {
			collapsable: true,
			collapse: display.center[fid].collapse,
			title: force.catalogue.name,
			subtitle: getModifiedName(force.gstLink,force),
			id: 'CP:'+force.id,
			classes: ['force'],
			icons: [{
						type: 'bi-x-lg',
						click: removeSelectionClick
					}]
		};
		// apply and capture new list root
		let forceSubList = addToList(mainList,params);
		
		// temporary organization object; always include 'uncategorized'
		let ctgLists = {
			uncategorized: {
					name: 'Uncategorized',
					entries: [],
					costSubtotal: {},
				}
		};
		// prep all prime categories (don't hide illegal selections)
		force.gstLink.categoryLinks.forEach(category => {
			
			ctgLists[category.targetId] = {
				name: getModifiedName(category,force),
				entries: [],
				costSubtotal: {},
			};
		});
		
		// sort root selection entries into their catalogue category
		for(const rootId in force.selections){
			const rosEntry = force.selections[rootId];
			
			// whats the prime ctg to sort under
			const primeCtg = getModifiedPrimeCtg(rosEntry.link,rosEntry);
			
			// if has a prime category, add to that list
			if(primeCtg && (primeCtg in ctgLists)){
				ctgLists[primeCtg].entries.push(rosEntry);
				subtotalCosts(ctgLists[primeCtg].costSubtotal,rosEntry.costs);
			}
		}
		
		// increase and freeze indent
		indent++;
		const catIndent = indent;
		// now loop and display categories and entries
		for(const ctgid in ctgLists){
			const category = ctgLists[ctgid];
			const catParams = {
				id: 'CP:'+fid+':'+ctgid,
				collapsable: true,
				collapse: display.center[fid][ctgid].collapse,
				title: category.name,
				classes: ['category','indent-'+catIndent],
				cost: makeCostStr(category.costSubtotal),
			};
			
			// if anything selected in this category
			if(category.entries.length > 0){
				
				// add and save list root reference
				let catSubList = addToList(forceSubList,catParams);
				
				// show all the root selection entries, and sub-selections
				category.entries.forEach(entry => {
					addNestedSelection(catSubList,entry,catIndent-1);
				});
			} // if category has entries
		}
	}
	
	// apply changes
	listHolder.appendChild(mainList);
	
}

// recursively add roster selections to center panel
function addNestedSelection(listScope,entry,indent){
		
	//determine entry type
	let eType = 'none';
	if(exists(entry.link.type))
		eType = entry.link.type;
	// if a SE link and linked formed, get the linked type
	if(eType === 'selectionEntry' && entry.link.link)
		eType = entry.link.link.type;
	
	// map type to desired icon
	let typeIcon = upgradeIcon;
	if(eType === 'unit'){
		typeIcon = unitIcon;
	}else if(eType === 'model'){
		typeIcon = modelIcon;
	}
	
	// indicate count
	let quantText = '';
	if(entry.quantity > 1)
		quantText = entry.quantity + 'x ';
	
	// does it have further child selections?
	let hasChildren = false;
	if( exists(entry.selections) && Object.keys(entry.selections).length>0 )
		hasChildren = true;
	
	// does it or it's linked entry have selection options for further children?
	let canHaveChildren = false;
	if( exists(entry.link.selectionEntries || entry.link.selectionEntryGroups || entry.link.entryLinks) )
		canHaveChildren = true;
	if( exists(entry.link.link) 
		&& (exists(entry.link.link.selectionEntries 
			|| entry.link.link.selectionEntryGroups 
			|| entry.link.link.entryLinks)) )
		canHaveChildren = true;
		
	// item indent is parent+1, up to max
	const itemIndent = indent >= maxIndent ? indent : indent+1;
	
	// check for immediate errors
	for(const constrArr of Object.values(entry.constraints ?? {})){
		// apply modifiers and check status
		let failedConstr = constrArr.map(c => getModifiedSingleConstr(c)).filter(c => !c.status);
		// check if any failed constr are also not hidden
		let unhiddenFail = failedConstr.map(c => getModifiedHidden(c.entryLink,entry)).some(h => !h);
		
		if(unhiddenFail){
			typeIcon = errorSumIcon;
			break;
		}
	}
	// also show as error if itself hidden
	if(selfOrPathHidden(entry))
		typeIcon = errorSumIcon;
	
	// configure item params
	// send closest roster link we have (for CP, thats the actual entry)
	let itemParam = {
		title: quantText + getModifiedName(entry.link,entry),
		id: getFullId(entry).join(':'),
		icons: [
		// {
			// type: 'bi-info-circle',
			// click: showInfo
		// },
		{
			type: 'bi-x-lg',
			click: removeSelectionClick
		}],
		iconL: typeIcon,
		classes: ['indent-'+itemIndent]
	};
	
	// change formatting for children
	if(hasChildren){
		itemParam.collapsable = true;
		itemParam.collapse = entry.collapse;
		// generate the subtitle
		let subtitle = '';
		Object.keys(entry.selections).forEach(key => {
			// only show 3x if >1
			const quant = entry.selections[key].quantity;
			const quantStr = quant>1? quant+'x ' : '';
			subtitle += ', ' + quantStr + entry.selections[key].name;
		});
		// trim lead comma
		itemParam.subtitle = subtitle.substr(2);
		// indicate to show/hide based on collapse state
		itemParam.toggleSubtitle = true;
	}
	// ensure bold if children possible
	if(canHaveChildren)
		itemParam.isBold = true;
	
	// add to list
	const newScope = addToList(listScope,itemParam);
	
	// call again for children
	if(hasChildren){
		Object.keys(entry.selections).forEach(childKey => {
			const childEntry = entry.selections[childKey];
			addNestedSelection(newScope,childEntry,itemIndent);
		});
	}
}

// handle list expanding/collapsing
var lastTarget;
function caretClick(event){
	
	// parse the click
	const target = getClickInfo(event);
	
	// left panel forces get different treatment
	if(target.isForce && target.leftPanel){
		// accordian forces
		const currentState = display.left[target.fid].collapse;
		Object.values(display.left).forEach(forceDisp => {
			forceDisp.collapse = true;
		});
		// reset this one
		display.left[target.fid].collapse = !currentState;
		
		// redraw the panel and abort
		updateLeftPanel();
		return;
	}
	
	// otherwise
	// toggle the caret
	event.target.classList.toggle('bi-caret-right-fill');
	event.target.classList.toggle('bi-caret-down-fill');
	
	// collapse the next neighbor of the main 'a' element
	target.node.nextElementSibling.classList.toggle('collapse');
	
	// record collapse state to objects
	if(target.isForce && target.centerPanel){
		display.center[target.fid].collapse = !display.center[target.fid].collapse;
	}else{
		target.link.collapse = !target.link.collapse;
	}
	
	// accordian left panel categories
	if(target.leftPanel && target.isCategory){
		// collapse all other categories
		const queryStr = '[id="LP:'+target.fid+'"]~div .category';
		const allCtg = document.querySelectorAll(queryStr);
		
		for(const ctg of allCtg){
			// extract ids
			const ctgId = ctg.id.split(':').pop();
			const ctgDisp = display.left[target.fid][ctgId];
			// all other non-collapsed categories
			if(ctgId !== target.id && !ctgDisp.collapse){
				// ensure it's collapsed
				ctgDisp.collapse = true;
				ctg.nextElementSibling.classList.add('collapse');
				// handle the caret
				const icon = ctg.querySelector('i');
				icon.classList.toggle('bi-caret-right-fill');
				icon.classList.toggle('bi-caret-down-fill');
			}
		}
	}
	
	// handle hiding subtitles
	if(target.node.classList.contains('toggle-sub')){
		let sub = document.querySelector('[id="'+target.node.id+'"] .subtitle');
		sub.classList.toggle('d-none');
	}
	
}

// handle left panel selection clicks
function selectUnitClick(event){
	lastSelection = event.target;	// debug
	
	// new approach
	const target = getClickInfo(event);
	lastTarget = target;
	
	const newSelect = {
		entry: target.link,
		parent: roster.forces[target.fid]  // root selection
	};
	
	addSelection(newSelect);
	
	// update the display
	switchMobileView('cp');
	fullDisplayUpdate();
	
}

// click handler to remove a selection from the roster
function removeSelectionClick(event){
	// console.time('remove');
	
	lastSelection = event.target;
	// parse click
	const target = getClickInfo(event);
	
	removeSelection(target.link);
	
	// check if the right panel is still valid (or roster root)
	const rpIsRoster = !exists(rightPanelEntry.id);
	if(rpIsRoster || rosterFromPath(getFullId(rightPanelEntry))){
		// simply update
		// updateRightPanel();
	}else{
		// entry no longer exists, just clear it
		hide('rp-all');
		rightPanelEntry = {};
	}
	// update the display
	fullDisplayUpdate();
	
	// console.timeEnd('remove');
}

// default handler for any panel item click
function itemClick(event){
	
	// don't follow the href
	event.preventDefault();
	
	// skip if a removal action
	if(event.target.classList.contains('bi-x-lg'))
		return;
	// skip if a collapsing action
	if(event.target.classList.contains('list-toggle'))
		return;
	// skip if an adding action
	if(event.target.classList.contains('bi-plus-lg'))
		return;
	
	let rootElem = event.target;
	// get the item id
	while(!rootElem.classList.contains('list-group-item')){
		// check if we hit a btn along path
		if(rootElem.classList.contains('btn'))
			return;
		// keep moving up ancestry
		rootElem = rootElem.parentElement;
	}
		
	const selectId = rootElem.id;
	
	// determine if the center or left panel
	while(!rootElem.classList.contains('list-group-root'))
		rootElem = rootElem.parentElement;
	
	// define left panel behavior
	if(rootElem.id === 'left-menu'){
		return;
	// define center panel behaviour
	}else if(rootElem.id === 'center-menu'){
		
		// if no selection id (e.g. category), abort
		if(!exists(selectId) || selectId.length === 0)
			return;
		
		// get roster entry (trim CP: from force entry)
		let rosterEntry = rosterFromPath(selectId.split('CP:').join(''));
		
		// if its actually changed
		if(!rightPanelEntry.id || rightPanelEntry.id !== rosterEntry.id){
			
			// update global state
			rightPanelEntry = rosterEntry;
			display.errors.collapse = true;
			
			// construct the form, from catalogue
			updateRightPanel();
		}
		// if actually some RP, show it
		if(rightPanelEntry || 0)
			switchMobileView('rp');
		
	}else if(rootElem.id === 'CP-inner-header'){
		// first show RP, in case it aborts back to CP
		switchMobileView('rp');
		
		// show base level roster options
		rightPanelEntry = roster;
		updateRightPanel();
	}
}

// read the DOM to get information about a click target
function getClickInfo(event){
	
	// default info
	let returnInfo = {
		isForce: false,
		isCategory: false,
		leftPanel: false,
		centerPanel: false,
		icon: false,
		id: '',
		fid: '',
		path: [],
		// node - the encompassing <a> element
		// link - roster entry
	};
	
	// find the parent <a> group
	let parentEl = event.target;
	while(parentEl.nodeName !== 'A' && parentEl.nodeName !== 'BODY')
		parentEl = parentEl.parentElement;
	// save the node itself
	returnInfo.node = parentEl;
	
	// class indicators
	returnInfo.isForce = parentEl.classList.contains('force');
	returnInfo.isCategory = parentEl.classList.contains('category');
	// search for icons
	for(const cssClass of parentEl.classList){
		if(cssClass in uiIcons){
			returnInfo.icon = uiIcons[cssClass];
			break;
		}
	}
	
	// manually search for the panel
	let rootElem = parentEl;
	while(!rootElem.classList.contains('list-group-root'))
		rootElem = rootElem.parentElement;
	if(rootElem.id === 'center-menu')
		returnInfo.centerPanel = true;
	if(rootElem.id === 'left-menu')
		returnInfo.leftPanel = true;
	// exit now if the RP error list
	if(rootElem.id === 'rp-errors'){
		returnInfo.link = display.errors;
		return returnInfo;
	}
	
	// parse the id / path
	if(exists(parentEl.id)){
		// check for panel indicators
		// returnInfo.leftPanel = /^LP:/.test(parentEl.id);
		// returnInfo.centerPanel = /^CP:/.test(parentEl.id);
		// get full path, dropping lead
		returnInfo.path = parentEl.id.split(/^LP:|^CP:/).join('').split(':');
		// just the last element of the path
		returnInfo.id = parentEl.id.split(':').pop();
		// fid is the first element of path
		returnInfo.fid = returnInfo.path[0];
		
		// attempt to produce a link to that entry
		if(returnInfo.isForce){
			returnInfo.link = roster.forces[returnInfo.id];
			
		}else if(returnInfo.isCategory){
			// get the display info
			const disp = returnInfo.leftPanel? display.left : display.center;
			returnInfo.link = disp[returnInfo.fid][returnInfo.id];
			
		}else if(returnInfo.leftPanel){
			// must be a root selection  TODO handle child forces
			returnInfo.link = roster.forces[returnInfo.fid].catalogue.root[returnInfo.id];
			
		}else if(returnInfo.centerPanel){
			// must be some kind of selection
			returnInfo.link = rosterFromPath(returnInfo.path);
		}
	}
	
	return returnInfo;
}

// convenience function
function makeElem(type,classes){
	let elem = document.createElement(type);
	if(exists(classes)){
		// handle string or array of strings input
		if(typeof classes === 'string'){
			elem.className = classes;
		}else{
			// otherwise assumed array of strings
			classes.forEach(thisClass => {
				elem.classList.add(thisClass);
			})
		}
	}
	
	return elem;
}

// add an element to a nested list; if establishing a new root, return that parent
function addToList(listParent,params){
	// basic item is an 'a' element with some classes
	let node = makeElem('a',['list-group-item','list-group-item-action']);	//item-action sets the font color
	// establish defaults if not specified in params
	const defaults = {
		collapsable: false,
		collapse: false,
		isBold: false,
		href: '#roster',
		title: '',
		subtitle: '',
		toggleSubtitle: false,
		classes: [],
		icons: [],
		cost: ''
	};
	// add any missing items to input params
	Object.keys(defaults).forEach(defKey => {
		if(!exists(params[defKey]))
			params[defKey] = defaults[defKey];
	});
	
	// build up the node
	node.href = params.href;
	if(exists(params.id))
		node.id = params.id;
	params.classes.forEach(addClass => {
		node.classList.add(addClass);
	});
	// default click action
	node.addEventListener('click', itemClick);
	
	// wrap everything in a flex box
	let flexBox = node.appendChild(makeElem('div',['d-flex','justify-content-start']));
	
	// collapsable element has bold text and caret
	if(params.collapsable){
		// the collapse/expand caret
		let caret = makeElem('i',['list-toggle','icon-small']);
		if(params.collapse){
			caret.classList.add('bi-caret-right-fill');
		}else{
			caret.classList.add('bi-caret-down-fill');
		}
		// make clickable
		caret.addEventListener('click', caretClick);
		flexBox.appendChild(caret);
	}else{
		// add empty icon element for spacing
		flexBox.appendChild(makeElem('i',['icon-small','empty-icon']));
	}
	
	// left icon, if any
	if(exists(params.iconL)){
		flexBox.appendChild(makeElem('i',[params.iconL,'icon-small']));
	}
	
	// bold text if subtitle provded, is collapsable, or specified as bold
	if(params.subtitle.length > 0 || params.collapsable || params.isBold){
		
		// text goes inside another flex box, with wrapping
		let textflex = flexBox.appendChild(makeElem('div',
						['d-flex','flex-wrap','flex-shrink-1','text-truncate',
						  'align-items-baseline','mr-auto']));
		
		// bold title
		let titleText = textflex.appendChild(makeElem('div',['pr-1','title']));
		// titleText.appendChild(makeElem('strong')).textContent = params.title;
		titleText.textContent = params.title;
		
		
		// cost element if any
		if(params.cost.length > 0 && params.subtitle.length == 0){
			
			// create subtitle
			let costText = textflex.appendChild(makeElem('div',['cost']));
			costText.textContent = params.cost;
			
		}
		
		// subtitle if any
		if(params.subtitle.length > 0){
			// append ':' to main title
			titleText.textContent += ':';
			// create subtitle
			let subtitle = textflex.appendChild(makeElem('div',['subtitle']));
			subtitle.textContent = params.subtitle;
			// make it toggle with caret clicks (flag the base node)
			if(params.toggleSubtitle)
				node.classList.add('toggle-sub');
			// set initial state
			if(params.toggleSubtitle && !params.collapse)
				subtitle.classList.add('d-none');
			
		}
		
	// simple unbold title
	}else{
		// text will wrap over multiple lines
		let titleText = flexBox.appendChild(makeElem('div',['pr-1','mr-auto']));
		titleText.textContent = params.title;
	}
	
	// icons
	params.icons.forEach(icon => {
		let iElem = flexBox.appendChild(makeElem('i',icon.type));
		iElem.addEventListener('click',icon.click);
	});
	
	listParent.appendChild(node);
	// make next list root if collapsable
	if(params.collapsable){
		let newRoot = node.insertAdjacentElement('afterend',makeElem('div','list-group'));
		if(params.collapse)
			newRoot.classList.add('collapse');
		return newRoot;
	}else{
		return node;
	}
	
}

// construct the form entry right panel
function updateRightPanel(){
	
	// if something's been selected
	if(rightPanelEntry.name || 0){
		// show the right panel
		show('rp-all');
		
	}else{
		//abort
		hide('rp-all');
		// if mobile, escape to CP
		switchMobileView('cp');
		return;
	}
	// get roster target
	rosterEntry = rightPanelEntry;
	// is the roster
	const isRoster = rosterEntry.forces && !rosterEntry.catalogue;
	
	// update title
	if(!isRoster){
		// get the right scope for name modifiers
		const isForce = rosterEntry.catalogue || 0;
		// const modScope = isForce ? rosterEntry : rosterEntry.parent;
		const catEntry = rosterEntry.gstLink ?? rosterEntry.link;
		document.getElementById('rp-titletext').innerText = getModifiedName(catEntry,rosterEntry);
	}else{
		document.getElementById('rp-titletext').innerText = rosterEntry.name;
	}
	
	
	// hide stats (handled in errorList code)
	hide("rp-stats");
	
	// get the root display area
	const displayRoot = document.getElementById('rp-formarea');
	// clear the display
	while (displayRoot.firstChild) {
        displayRoot.removeChild(displayRoot.firstChild);
    }
	
	// collect all the SE and SEGs; don't suppress hidden entries
	let opt = compileSelectableOptions(rosterEntry.link,rosterEntry,false);
	
	// build the form page from the compiled options tree
	show("rp-formarea");
	constructRpForm(displayRoot,opt);
	
	
	// show errors, (called after form construction to check if any inputs rendered)
	constructErrorList();
	
	
	// update title bar cost
	let coststr = makeCostStr(rightPanelEntry.costs);
	if(coststr.length > 0){
		show("rp-titlecost");
		const costElem = document.getElementById("rp-titlecost");
		costElem.textContent = coststr;
		
	}else{
		hide("rp-titlecost");
	}
	
}

// format a right-panel form group from a list of parameters; return the scope inside that group
function addFormGroup(scope,params){
	
	// containing div
	let maindiv = scope.appendChild(makeElem('div',['mb-2','outer-group']));
	// make each form line
	params.children.forEach(SE => {
		let formLine = maindiv.appendChild(makeElem('div'));
		let costSpan;  // placeholder
		
		// checkbox and radio inputs
		if(SE.type === 'check' || SE.type === 'radio'){
			formLine.classList.add('form-check');
			
			// checkbox/radio itself
			let input = formLine.appendChild(makeElem('input','form-check-input'));
			input.id = SE.id;
			if(SE.type === 'check'){
				input.type = 'checkbox';
			}else if(SE.type === 'radio'){
				input.type = 'radio';
				// add the radio group
				input.name = SE.radioGroup;
			}else{
				console.log('Unexpected input type: '+SE.type);
			}
			// is it checked
			if(SE.checked || 0)
				input.checked = "checked";
			
			// text label
			let label = formLine.appendChild(makeElem('label','form-check-label'));
			label.for = SE.id;
			label.textContent = SE.label;
			
			// add cost placeholder, inline small span
			costSpan = label.appendChild(makeElem('span',['small','text-muted','ml-3']));
			
		// number inputs
		}else if(SE.type = 'number'){
			// console.log(SE);
			// formLine.classList.add('form-group');
			formLine.classList.add('d-flex');
			formLine.classList.add('align-items-baseline');
			
			// numbers need an inner div
			// let innerDiv = formLine.appendChild(makeElem('div','number-in'));
			let input = formLine.appendChild(makeElem('input','number-in'));
			// set parameters
			input.id = SE.id;
			input.type = 'number';
			input.step = '1';
			// derived params
			['min','max','value'].forEach(param => {
				input[param] = SE[param];
			});
			
			// text label
			let label = formLine.appendChild(makeElem('label',['number-in']));
			label.for = SE.id;
			label.textContent = SE.label;
			
			// add cost placeholder
			costSpan = label.appendChild(makeElem('span',['small','text-muted','ml-3']));
		}
		
		// construct cost string
		const costType = Object.keys(SE.cost);
		if(costType.length > 0){
			
			let costStr = '(';
			for(let k=0; k<costType.length; k++){
				const costValue = parseInt(SE.cost[costType[k]]);
				// add explicit + to positives
				if(costValue > 0)
					costStr += '+';
				costStr += costValue + ' '+costType[k];
				// if not last, add a comma
				if(k !== costType.length-1)
					costStr += ', ';
			}
			costStr += ')';
			costSpan.textContent = costStr;
		}
	});
	
	// console.log(params);
}

// format a right-panel subgroup
function addSubgroup(scope,params){
	// containing div
	let maindiv = scope.appendChild(makeElem('div',["text-muted","border-bottom","pl-3"]));
	// inner text
	let titleText = maindiv.appendChild(makeElem('small'));
	titleText.textContent = params.title;
	
}

// list out errors of the current right panel entry
function constructErrorList(){
	
	// shorten
	const rosEntry = rightPanelEntry;
	
	// is this the roster?
	const isRoster = rightPanelEntry.forces && !rightPanelEntry.catalogue;
	const isForce = rightPanelEntry.catalogue;
	
	// get force reference
	const force = parentForce(rightPanelEntry);
	
	// get the root display area
	const displayRoot = document.getElementById('rp-errors');
	// clear the display
	displayRoot.replaceChildren();
	
	// work in a temp fragment
	const displayFrag = document.createDocumentFragment();
	
	
	// accumulate all the errors, simply failed constraints
	let errors = [];
	let allConstr = [];
	
	// only list all if roster scoped
	if(isRoster){
		// compile all the constraints
		allConstr = compileConstraints(rightPanelEntry);
		
	}else{
		// otherwise, just get immediate
		Object.values(rightPanelEntry.constraints ?? []).forEach(constrArr => {
			constrArr.forEach(constr => {
				allConstr.push(constr);
			});
		});
	}
	
	// run through the collected list
	allConstr.forEach(constr => {
		// apply modifiers
		const modConstr = getModifiedSingleConstr(constr);
		
		// is the constrained entry hidden?
		const hiddenConstr = getModifiedHidden(constr.entryLink,rosEntry);
		
		// if failing and not hidden, add to error list
		if(!modConstr.status && !hiddenConstr)
			errors.push(modConstr);
	});
	
	
	// evaluate self or children selections that are now hidden
	let hideErrArr = [];
	if(!isRoster){
		
		// check self, if not a force
		if(!rosEntry.catalogue && selfOrPathHidden(rosEntry)){
			// store catalogue entry
			hideErrArr.push(rosEntry.link);
		}
		
		// filter immediate children
		Object.values(rosEntry.selections ?? {}).filter(child => selfOrPathHidden(child)).forEach(child => {
			hideErrArr.push(child.link);
		});
	}
	
	
	// put a wrapper around hide errors, and add to main error list
	hideErrArr.forEach(hideErrEntry => {
		errors.push({
			isHidden: true,
			entry: hideErrEntry,
		});
	});
	
	// todo add force and roster errors
	// only show errors that can be fixed here; force/roster errors of (potential) children?
	
	// check if anything got rendered to the right panel
	if(document.querySelectorAll('#rp-formarea input').length === 0){
		// expand the error list
		display.errors.collapse = false;
		// hide the form area for spacing reasons
		hide("rp-formarea");
	}
		
	
	// if any, display them
	if(errors.length > 0){
		show("rp-errors");
		let eList = displayFrag;
		
		if(errors.length > 1){
			// make a summary entry
			const itemParam = {
				title: errors.length+' Errors',
				id: '',
				collapsable: true,
				collapse: display.errors.collapse,
				iconL: errorSumIcon,
				classes: ['errors']
			};
			// add to list
			eList = addToList(displayFrag,itemParam);
		}
		
		// then make the list
		errors.forEach(err => {
			
			let errMes;
			
			// handle errors differently if based on constraint or hidden entry
			if(err.isHidden){
				// these are because the entry or it's parent SEGs/links are hidden
				// get shared entry name if available
				const name = err.entry.link?.name ?? err.entry.name;
				// simple message
				errMes = name+' is not a valid selection';
				
			}else{
				// these are from constraints
				// construct error message
				errMes = (err.link.type === 'min' ? 'Minimum ' : 'Max ') + err.value;
				
				// SEG of form "max X selections from SEG"
				if(err.type === 'SEG')
					errMes += ' selection' + (err.value>1 ? 's' : '') + ' from';
				// take the shared entry name if available
				errMes += ' ' + (err.entryLink.link?.name ?? err.entryLink.name);
				
				// ctg of form "Max X ctg selections"
				if(err.type === 'category')
					errMes += ' selection' + (err.value>1 ? 's' : '');
				// debug, vurrent quant
				errMes += ' (currently '+err.count+')';
				
			}
			
			// make the entry
			const errParam = {
				title: errMes,
				iconL: errorIcon,
				classes: ['indent-0','errors']
			};
			// add to list
			addToList(eList,errParam);
			
		});
		
		// link up fragment to live display
		displayRoot.appendChild(displayFrag);
	
	}else{
		// if no errors, hide it to correct spacing
		hide("rp-errors");
	}
	
	
	// show some stats on the roster page
	if(isRoster){
		// count some stuff
		let counts = {constraints:0, conditions:0, modifiers:0};
		
		// make a recursive funtion to count logic
		function countLogic(node,counts){
			
			// count this roster node's logic
			Object.keys(counts).forEach(countKey => {
				// logic for specific targets held in objects
				Object.values(node[countKey] ?? {}).forEach(logicArr => {
					// note each value is itself an array
					counts[countKey] += logicArr.length;
				});
			});
			
			// call on all valid children, passing in current count
			Object.values(node.forces ?? {}).forEach(childForce => {
				countLogic(childForce,counts);
			});
			Object.values(node.selections ?? {}).forEach(childSelect => {
				countLogic(childSelect,counts);
			});
			
			return counts;
		}
		
		
		// execute
		counts = countLogic(roster,counts);
		
		// construct the display message
		let statElem = document.getElementById("rp-stats");
		statElem.textContent = 'Tracking '+counts.constraints+' constraints, '
					+counts.modifiers+' modifiers, and '+counts.conditions+' conditions... so far';
		
		// only display if >0
		if(counts.constraints + counts.conditions + counts.modifiers > 0)
			show("rp-stats");
	}
	
	// use the stats line to place the force catalogue revision
	if(isForce){
		
		show("rp-stats");
		
		// construct the display message
		let statElem = document.getElementById("rp-stats");
		statElem.textContent = force.catalogue.name+', v'+force.catalogue.revision;
		
	}
	
}

// check if this roster selection or path are hidden; returns bool
function selfOrPathHidden(rosEntry){
	
	let catEntry = rosEntry.link;
	
	// check self
	if(getModifiedHidden(catEntry,rosEntry))
		return true;
	
	// check path as well
	if(getPathEntries(rosEntry).some(pathEntry => getModifiedHidden(pathEntry,rosEntry)))
		return true;
	
	// check the prime ctg, if any
	// whats the prime ctg to sort under
	const primeCtgStr = getModifiedPrimeCtg(catEntry,rosEntry);
	
	if(primeCtgStr && primeCtgStr !== 'uncategorized'){
		// get a link to that category link
		const primCtg = parentForce(rosEntry).gstLink.categoryLinks
					.filter(c => c.targetId===primeCtgStr)[0] ?? {};
		// is that prime ctg hidden
		const ctgHidden = getModifiedHidden(primCtg,rosEntry);
		
		if(ctgHidden)
			return true;
	}
	
	
	// otherwise false
	return false;
}

// compile a flat list of constriants of all child entries
function compileConstraints(entry){
	let fullList = [];
	
	// collect this entry's constraints
	Object.values(entry.constraints ?? []).forEach(constrArr => {
		constrArr.forEach(constr => {
			// make a wrapper for it
			// const constrWr = {
				// source: entry,
				// constr: constr,
			// }
			fullList.push(constr);
		});
	});
	
	// call on all children forces and selections
	Object.values(entry.forces ?? {}).concat(Object.values(entry.selections ?? {})).forEach(child => {
		fullList = fullList.concat(compileConstraints(child));
	});
	
	return fullList;
}

// process changes to the right-panel form
var formNode;
function processRpForm(){
	const formEl = document.getElementById('rp-formarea');
	const formGroups = formEl.children;
	
	// filter down a list of input elements
	let inputs = [];
	for(let k=0; k<formGroups.length; k++){
		if(formGroups[k].classList.contains('outer-group')){
			
			for(let m=0; m<formGroups[k].children.length; m++){
				// skip over the form-group div
				const inputEl = formGroups[k].children[m].children[0];
				// verify it's the input element
				if(inputEl.nodeName === 'INPUT'){
					inputs.push(inputEl);
				}else{
					console.log('expected to find INPUT element')
				}
			}
		}
	}
	
	// console.log(inputs);
	formNode = inputs;
	// track if update needed
	let somethingChanged = false;
	// get the parent entity's quantity
	const parentQuant = rightPanelEntry.quantity || 1;
	
	// check each input status and compare to roster, skipping 'None' options
	const skiprgx = /NONE/;
	inputs.filter(i => !skiprgx.test(i.id)).forEach(input => {
		// get input status (force to number)
		let value = input.checked+0;
		if(input.type === 'number'){
			
			value = parseInt(input.value);
			// max/min respects illegal entries made programmatically
			// go ahead and process min/max immediately
			const inMax = parseInt(input.max);
			const inMin = parseInt(input.min);
			if(inMax!==NaN && value > inMax){
				value = inMax;
				input.value = ''+inMax;
			}
			if(inMin!==NaN && value < inMin){
				value = inMin;
				input.value = ''+inMin;
			}
		}
		
		const inputId = input.id;
		
		// does this item exist in the roster?
		// need to do a deep compare
		const hasSelections = rightPanelEntry.selections || 0;
		let inRoster = false;
		let rosterEntry;
		let rosterQuant = 0;
		if(hasSelections){
			const matchedKey = Object.keys(rightPanelEntry.selections).filter(
						skey => rightPanelEntry.selections[skey].entryId === inputId);
			if(matchedKey.length > 0){
				inRoster = true;
				rosterEntry = rightPanelEntry.selections[matchedKey[0]];
				// also get the roster entry quantity per parent unit
				// sum over potentially multiple non-merging entries
				matchedKey.forEach(key => {
					rosterQuant += rightPanelEntry.selections[matchedKey[0]].quantity / parentQuant;
				});
			}
		}
		
		// a change in quantity, and mergable
		if(inRoster && value>0 && rosterQuant!==value && rosterEntry.link.merge){
			
			// recursively update quantity (scaled by parent quant) and all children
			changeSelectionQuantity(rosterEntry,value*parentQuant);
			
			// flag for update
			somethingChanged = true;
		
		// a new selection was made, or a non-merging quantity change
		}else if(value >= rosterQuant){
			
			// get the catalogue entry
			const catEntry = catalogueFromPath(rightPanelEntry.link,inputId);
			// clean up the path (remove last entry)
			let path = inputId.split(':');
			path.pop();
			path = path.join(':');
			// params for adding
			let addParams = {
				entry: catEntry,
				parent: rightPanelEntry,
				quantity: (value-rosterQuant)*parentQuant,
				catPath: path
			};
			// if mergable, or only adding one unit
			if(catEntry.merge || value-rosterQuant===1){
				// add to roster
				addSelection(addParams);
			}else{
				// otherwise, add multiple separate entries
				addParams.quantity = 1;
				for(let k=0; k<value-rosterQuant; k++){
					addSelection(addParams);
				}
			}
			
			// flag for update
			somethingChanged = true;
			
			
		// something was unselected
		}else if(inRoster && value<=0){
			
			// remove it from the roster
			removeSelection(rosterEntry);
			
			// delete rosterEntry.parent.selections[rosterEntry.id];
			somethingChanged = true;
		}
		
	});
	
	// process all updates before refreshing display
	if(somethingChanged){
		fullDisplayUpdate();
	}
}

// generate a short string showing the costs of an item
function makeCostStr(costs){
	
	let coststr = '';
	// let costs = rosEntry.costs;
	
	// if no costs, return empty string
	if(!costs)
		return coststr;
	
	// else, iterate through cost object
	let costArr = [];
	Object.values(costs).forEach(costEl => {
		// only display non-zero costs
		if(costEl.value != 0){
			costArr.push(costEl.value+costEl.name);
		}
	});
	
	// insert commas
	coststr = costArr.join(', ');
	return coststr;
	
}




//  -------------- BACKEND  -----------------

// link and compile a full catalog from individual files
async function compileCatalogue(factionInd,newForceObj){
	
	// construct list of linked catalogue ids, starting with primary
	const primaryId = fileIndex[factionInd].id;
	var linkedCats = {};
	
	if(!online){
		linkedCats = {
			[primaryId]: {
				// remove file extension if not already
				name: fileIndex[factionInd].name.split('.cat')[0],
				importRoot: true,
				indexLink: fileIndex[factionInd]
			}
		}
		// loop until no new catalogues referenced
		let addedCat = true;
		while(addedCat){
			addedCat = false;
			// cycle over all catalogues linked so far
			Object.keys(linkedCats).forEach(linkid => {
				// cycle through their linked catalogues
				linkedCats[linkid].indexLink.linked.forEach(catLink => {
					if(catLink.targetId in linkedCats){
						// already linked, check import status
						if(catLink.importRoot === 'true')
							linkedCats[catLink.targetId].importRoot = true;
					}else{
						// new link, add to list
						addedCat = true;
						linkedCats[catLink.targetId] = {
							// primary: false,
							importRoot: (catLink.importRoot === 'true'),
							name: catLink.name,
							indexLink: fileIndex.filter(cat => cat.id === catLink.targetId)[0]
						};
					}
				});
			});
		}
		
		// prime catalogue gets final say on removing root imports
		linkedCats[primaryId].indexLink.linked.forEach(catLink => {
			linkedCats[catLink.targetId].importRoot = (catLink.importRoot === 'true');
		});
		
		// fetch the catalogue(s)
		let promArr = [];
		Object.keys(linkedCats).forEach(linkid => {
			// check if data already available
			if(linkid in catalogueData){
				// make a copy of the catalogue
				linkedCats[linkid].data = JSON.parse(catalogueData[linkid]);
			}else{
				// fetch new data (save promise)
				promArr.push( 
					getStringData(dataPath+linkedCats[linkid].name+'.cat.json')
					.then(str => {
						catalogueData[linkid] = str;
						linkedCats[linkid].data = JSON.parse(str);
					}).catch(console.log));
			}
		});
		// tack on a copy of the game system
		linkedCats.gst = {
			importRoot: true,
			name: gameSystem.name,
			data: JSON.parse(JSON.stringify(gameSystem))
		};
		
		// once data arrived, execute the merge
		// console.time('network');
		await Promise.all(promArr);
		// console.timeEnd('network');
		
		
	}else{
		// online case
		
		// wait for preloads to finish
		await Promise.all(catalogueData.prom);
		
		let promArr = [];
		
		// copy in precompiled import list
		fileIndex[primaryId].fullImport.forEach(importItem => {
			
			const linkid = importItem.id;
			
			linkedCats[linkid] = {
				importRoot: importItem.importRoot
			};
			
			// check if data already available
			if(linkid in catalogueData){
				// make a copy of the catalogue 
				linkedCats[linkid].data = JSON.parse(catalogueData[linkid]);
				
			}else{
				// fetch new data (save promise)
				promArr.push( 
					getStringData([dataPath,roster.repo,fileIndex[linkid].filename].join('/'))
					.then(str => {
						catalogueData[linkid] = str;
						linkedCats[linkid].data = xmlStrToJson(str);
					})
					.catch(console.log));
			}
			
		});
		
		// tack on a copy of the game system
		linkedCats.gst = {
			importRoot: true,
			name: gameSystem.name,
			data: JSON.parse(JSON.stringify(gameSystem))
		};
		
		await Promise.all(promArr);
	}
	
	
	
	// populate basic info
	let fullCat = {};
	headerTags.forEach(tag => {
		fullCat[tag] = linkedCats[primaryId].data[tag];
	});
	
	// store a list of source catalogues
	fullCat.sources = {};
	
	// merge relevant shared categories
	// root selections must be marked for import, importRoot, and in force categories
	// prep force categories, map ids to names
	// let validCatg = {};
	fullCat.root = {};
	fullCat.index = {};
	// newForceObj.gstLink.categoryLinks.forEach(ctg => {
		// validCatg[ctg.targetId] = ctg.name;
	// });
	
	let entryCount = 0;
	// validCtg = validCatg;  // debug
	
	// two step process, first add shared entries indexed by id
	Object.keys(linkedCats).forEach(catid => {
		const thisCat = linkedCats[catid].data;
		
		// track data sources
		fullCat.sources[catid] = thisCat.name;
		
		//debug
		// test if we've missed a tag type
		Object.keys(thisCat).forEach(baseKey => {
			if(headerTags.filter(a => a===baseKey).length == 0 &&
				baseTags.filter(a => a===baseKey).length == 0 &&
				sharedTags.filter(a => a===baseKey).length == 0 &&
				rootSelectionTags.filter(a => a===baseKey).length == 0 &&
				ignoreTags.filter(a => a===baseKey).length == 0){
				// if not in any of our pre-set types
				console.log('unexpected root tag: '+baseKey);
			}
		});
		
		// first store base info
		baseTags.forEach(tag => {
			// if this tag present in linked catalogue
			if(exists(thisCat[tag])){
				// if doesn't exist in prime, add it
				if(!exists(fullCat[tag]))
					fullCat[tag] = {};
				// iterate through all entries in linked catalogue
				thisCat[tag].forEach(entry => {
					// only fail if explicitly false (some shared categories don't flag import)
					// let importDefault = !(exists(entry.import));
					if(entry.import !== 'false'){
						// add the entry
						fullCat[tag][entry.id] = entry;
					}
				});
			}
		});
		
		// then grab all shared info, dumped into index
		sharedTags.forEach(tag => {
			// if this tag present in linked catalogue
			if(exists(thisCat[tag])){
				// iterate through all entries in linked catalogue
				thisCat[tag].forEach(entry => {
					// only fail if explicitly false (some shared categories don't flag import)
					// let importDefault = !(exists(entry.import));
					if(entry.import !== 'false'){
						// track source
						entry.source = catid;
						// add the entry
						fullCat.index[entry.id] = entry;
					}
				});
			}
		});
	});
	
	// then add root entries, pay attention to prime category
	Object.keys(linkedCats).forEach(catid => {
		const thisCat = linkedCats[catid].data;
		// check if root entries required
		if(linkedCats[catid].importRoot){
			rootSelectionTags.forEach(tag => {
				// if linked cat has this root tag
				if(exists(thisCat[tag])){
					
					thisCat[tag].forEach(entry => {
						lastEntry = entry;	//debug
						lastCat = thisCat;	//debug
						
						// check if prime category marked
						const hasAnyCtg = exists(entry.categoryLinks);
						let primeCtgArr = [];
						if(hasAnyCtg)
							primeCtgArr = entry.categoryLinks.filter(ctg => ctg.primary==='true');
						let hasPrimeCtg = primeCtgArr.length > 0;
						// let forceInclude = false;
						// check entry for set-primary modifiers
						// if( exists(entry.modifiers) 
								// && entry.modifiers.some(m => m.type==='set-primary')){
							// forceInclude = true;
						// }
						
						// also check referenced sharedSelectionEntry
						if(entry.targetId && fullCat.index[entry.targetId]){
							
							// get referenced shared entry
							let sharedEntry = fullCat.index[entry.targetId];
							// force names to align
							entry.name = sharedEntry.name;
							
							// check linked entry for set-primary modifiers
							// if( exists(sharedEntry.modifiers) 
									// && sharedEntry.modifiers.some(m => m.type==='set-primary'))
								// forceInclude = true;
							
							// get that entry's prime category object, if any
							if(!hasPrimeCtg && sharedEntry.categoryLinks){
								let primeCtg = sharedEntry.categoryLinks.filter(ctg => ctg.primary==='true')[0];
								// add that category link to the selection link
								if(exists(primeCtg)){
									// do not push prime ctg into entryLink
									// update logic
									hasPrimeCtg = true;
									primeCtgArr[0] = primeCtg;
								}
							}
							
						}
						
						// finally check if category is in this force's list
						// const inForceCtg = hasPrimeCtg && (primeCtgArr[0].targetId in validCatg);
						// either marked for import, or is in prime catalogue
						const markedImport = (entry.import==='true' || catid === primaryId);
						
						// allow dynamic categories (forceInclude) to override
						if(markedImport ){//&& (inForceCtg || forceInclude) ){
							
							// record prime category if found
							if(hasPrimeCtg)
								entry.primeCtg = primeCtgArr[0].targetId;
							
							// track source (debug)
							entry.source = catid;
							// add to catalogue root	
							fullCat.root[entry.id] = entry;
						}
						
					});	// forEach entry
				}  // if tag exists
			});  // forEach tag
		}  // if importRoot
	});  // forEach catid
	
	lastCat = fullCat;	//debug
	
	// finally, internally connect links to shared index entries
	// recursive from root outward
	linksMade = 0;
	const fid = newForceObj.id;
	missingLinks[fid] = {};
	for(let rid in fullCat.root){
		linkCatalogueEntry(fullCat, fullCat.root[rid], fid);
	}
	console.log('linked '+linksMade+' entries');
	
	lastCat = fullCat;	//debug
	
	return fullCat;
}

var lastEntry;
var lastKey;
var lastCat;
var validCtg;

// import an existing roster
var rosj;
async function importRoster(){
	
	console.time('import');
	
	const inFile = document.getElementById("fileUpload").files[0];
	// initialize holder for the json roster
	let rosjProm;
	
	// detect zipped files
	const zipRgx = /rosz$/i;
	
	if(zipRgx.test(inFile.name)){
		
		// zip archive
		rosjProm = JSZip.loadAsync(inFile)
			.then(zipArch => {
				
				// need filename to access and convert to string
				let fname = Object.keys(zipArch.files)[0];
				
				// extract from the zip and process into JSON, returning promise
				return zipArch.file(fname).async('string').then(xmlStrToJson);
				
			}).catch(console.log);
		
	}else{
		// basic text file
		rosjProm = file2text(inFile).then(xmlStrToJson)
			.catch(console.log);
	}
	
	// wait for promises to resolve
	rosj = await rosjProm;
	console.log(rosj);
	
	// check if the roster's gamesystem is supported
	const rosGst = rosj.gameSystemId;
	// find the repo in the gallery list (repo might contain a list of multiple gst)
	const repo = galleryData.repositories.filter(r => (r.gamesystemData ?? []).some(g => g.id === rosGst))[0];
	// the subentry for the gst
	const gameSubentry = (repo.gamesystemData ?? []).filter(g => g.id === rosGst)[0];
	
	// validate we found the game and it's currently supported
	if(!repo || !gameSubentry || !popGst.some(g => g === repo.name)){
		// make an error message
		console.log('Unsupported gamesystem: '+rosGst+', '+repo.name);
		// abort import
		return;
	}
	// else continue
	document.getElementById("importBtn").disabled = false;
	
	
	// fetch file index and gamesystem rules (promises)
	fileIndex = getJsonData([dataPath,repo.name,'fileIndex.json'].join('/'));
	gameSystem = getXmlData([dataPath,repo.name,gameSubentry.filename].join('/'));
	
	// update the summary text
	document.getElementById("LP-header-title").textContent = gameSubentry.name;
	document.getElementById("LP-header-subtitle").textContent = ' - v'+gameSubentry.rev;
	
	// grab some high level data
	roster.name = rosj.name;
	roster.game = rosGst;
	roster.repo = repo.name;
	
	// wait for initial files to load
	fileIndex = await fileIndex;
	
	// start fetching all the force catalogues
	rosj.forces.forEach(inForce => {
		
		fileIndex[inForce.catalogueId].fullImport.forEach(importItem => {
			
			let linkid = importItem.id;
			
			// check that not a repeat
			if(!(linkid in catalogueData)){
				// placeholder in catalogueData to prevent duplicate
				catalogueData[linkid] = 'placeholder';
				
				// initiate the download and store a copy, track the promise
				catalogueData.prom.push(
					getStringData([dataPath,roster.repo,fileIndex[linkid].filename].join('/'))
					.then(str => {
						// parse the xml to JSON, then store JSON str
						catalogueData[linkid] = JSON.stringify(xmlStrToJson(str));
					})
					.catch(console.log)
				);
				
			}
		});
		
	});
	// let gamesystem finish
	gameSystem = await gameSystem;
	
	// now import the forces
	for(let inForce of rosj.forces){
		importProms.push(importForce(inForce));
	}
	
	console.timeEnd('import');
}

// import a force from ros file
function importForce(inForce){
	// first create the force entry itself
	
	// construct force params
	let params = {
		scope: 'Roster',
		forceType: inForce.entryId,
		factionInd: inForce.catalogueId,
	};
	// dont autoselect
	let fidProm = submitForce(params,false);
	
	
	// wrap selection handling into a then, once fid resolved
	fidProm.then(fid => {
		// run through all its root selections, recursively
		(inForce.selections ?? []).forEach(inSel => {
			
			importSelection(roster.forces[fid],inSel);
		});
	});
	
	// return a ref to the promise
	return fidProm;
}

// import a selection and its children from a ros file
function importSelection(rosParent,inSel){
	// expecting roster parent, import selection
	
	// get a force reference from roster parent
	const force = parentForce(rosParent);
	// is it a root selection; parent is a force
	const isRoot = rosParent.catalogue ||0;
	
	let bsPath = inSel.entryId.split('::');
	// get the path to the current roster parent
	let rootPath = getFullPath(rosParent);
	
	// prep newSelect params
	let newSelect = {
		quantity: parseInt(inSel.number),
		parent: rosParent,
		autoSelect: false,
	};
	
	
	if(isRoot){
		// check the root catalogue for this id
		if(bsPath[0] in force.catalogue.root){
			// add a catalogue ref
			// note root case the first id is either the link or entry itself
			newSelect.entry = force.catalogue.root[bsPath[0]];
			
		}else{
			// debug
			console.log('did not find import entry: '+inSel.entryId,inSel);
		}
		
	}else{
		// grab the target id
		const targetId = bsPath.pop();
		
		// compile all options, and flatten
		let opt = flattenOpts( compileSelectableOptions(rosParent.link,rosParent,false));
		
		// check the options
		let foundEntry = false;
		opt.forEach(SE => {
			
			// basic check first
			if(SE.entry.id === targetId || SE.entry.targetId === targetId){
				
				// validate all BS path entries are in our path
				let foundFullPath = true;
				// BS includes the full path from root
				let catPath = rootPath.concat(SE.path);
				
				bsPath.forEach(pathLink => {
					foundFullPath &= catPath.includes(pathLink);
				});
				
				if(foundFullPath){
					foundEntry = true;
					newSelect.entry = SE.entry;
					// store the path
					const partialPath = SE.path;
					partialPath.pop();
					newSelect.catPath = partialPath.join(':');
				}else{
					console.log('Found targetId but failed to validate path: '+inSel.name,rosParent);
				}
				
			}
			
		});
		
		// debug
		if(!foundEntry){
			console.log('Failed to find child entry '+inSel.entryId,rosParent);
		}
		
	}
	
	// if we found something, add it to roster and add children
	if(newSelect.entry || 0){
		let rosLink = addSelection(newSelect);
		(inSel.selections ?? []).forEach(childSel => 
			importSelection(rosLink,childSel));
		
	}
	
}

var linksMade;
// recursively link up an element and it's children
function linkCatalogueEntry(fullCat, thisEntry, fid){
	lastEntry = thisEntry; // debug
	
	// first, if it itself is a Link and hasn't yet been, link to target
	// and then link up that link entry as well
	if(exists(thisEntry.targetId) && !exists(thisEntry.link)){
		if(exists(fullCat.index[thisEntry.targetId])){
			thisEntry.link = fullCat.index[thisEntry.targetId];
			// newLinks.push(thisEntry.link);
			linkCatalogueEntry(fullCat, thisEntry.link, fid);
		}else{
			// track unique missing links
			if(!exists(missingLinks[fid][thisEntry.targetId])){
				missingLinks[fid][thisEntry.targetId] = thisEntry;
			}
		}
		linksMade++;
	}
	// repeat for any iterable children
	Object.keys(thisEntry).forEach(key => {
		// detect array by length property, use object to avoid strings
		if(exists(thisEntry[key].length) && typeof(thisEntry[key])==='object'){
			// repeat for each element of that array
			lastKey = key; // debug
			thisEntry[key].forEach(childEntry => {
				linkCatalogueEntry(fullCat, childEntry, fid);
			});
		}
	});
	
}

// do an exhaustive search to fill any entryLinks which do not point to root shared entries
function fillMissingLinks(fid){
	
	const catalogue = roster.forces[fid].catalogue;
	// run through all the missing entries
	Object.keys(missingLinks[fid]).forEach(mkey => {
		// note mkey is the missing targetId
		const missing = missingLinks[fid][mkey];
		let foundEntry = false;
		
		// first run through all the root keys
		for(const rootKey in catalogue.root){
			const thisEntry = catalogue.root[rootKey];
			// execute search
			foundEntry = searchChildren(thisEntry,mkey);
			// if its been found, break
			if(foundEntry)
				break;
		}
		
		// if not yet found, check sharedEntries
		if(!foundEntry){
			for(const sharedKey in catalogue.index){
				// slightly needlessly checking random types (index includes other shared things)
				const thisEntry = catalogue.index[sharedKey];
				// execute search
				foundEntry = searchChildren(thisEntry,mkey);
				// if its been found, break
				if(foundEntry)
					break;
			}
		}
		
		if(!foundEntry){
			console.log('failed to find '+missing.name+', type: '+missing.type);
		}else{
			// add it to the index
			catalogue.index[mkey] = foundEntry;
			// link up the parent
			missing.link = catalogue.index[mkey];
		}
		
	});
	// Todo add some faction level note on where to find this to prevent a search in the future?
}

// check if any children are the input id, then search children
function searchChildren(thisEntry,cmpId){
	// don't follow links, to reduce redundant search
	if(thisEntry.link)
		return false;
	
	// is this it?
	if(thisEntry.id === cmpId)
		return thisEntry;
	
	// Todo support other missing link types
	// otherwise search SE and SEGs
	if(thisEntry.selectionEntries){
		for(const SE of thisEntry.selectionEntries){
			// call on children
			const foundEntry = searchChildren(SE,cmpId);
			// if found, finish and return
			if(foundEntry) return foundEntry;
		}
	}
	if(thisEntry.selectionEntryGroups){
		for(const SEG of thisEntry.selectionEntryGroups){
			// call on children
			const foundEntry = searchChildren(SEG,cmpId);
			if(foundEntry) return foundEntry;
		}
	}
	// if still not, return false
	return false;
}

// compile Force and Roster scoped constraints
function compileForceConstraints(fid,storeForceConstr){
	
	// make roster entry if not yet
	if(!roster.constraints)
		roster.constraints = {};
	// make for force
	let force = roster.forces[fid];
	
	if(storeForceConstr){
		force.constraints = {};
	}
	
	// run on the force entry itself
	getConstraintsRec(fid,force.gstLink,true,storeForceConstr);
	
	
	// run through all force-linked categories
	force.gstLink.categoryLinks.forEach(thisCtg => {
		// process through same routine as the others
		getConstraintsRec(fid,thisCtg,true,storeForceConstr);
	});
	
	// run through root entries
	for(const key in force.catalogue.root){
		getConstraintsRec(fid,force.catalogue.root[key],true,storeForceConstr);
	}
	
	// run through shared entries (includes categories)
	for(const key in force.catalogue.index){
		getConstraintsRec(fid,force.catalogue.index[key],false,storeForceConstr);
	}
	
	
}

// check an entry for force and roster-scoped constraints, then search its children
function getConstraintsRec(fid,entry,isRoot,storeForceConstr){
	
	const force = roster.forces[fid];
	// store under targetId if a link
	const storeId = entry.targetId ?? entry.id;
	// get the constraints, if any
	let constrArr = entry.constraints ?? [];
	// for root link objects, also check the shared entry (incl. parent scope)
	// entry.type eliminates categoryLinks, which we don't want to follow
	if(isRoot && entry.link && entry.type)
		constrArr = constrArr.concat((entry.link.constraints ?? []));
	
	
	constrArr.forEach(constr => {
		// parse and store a few points
		let constrObj = {
			count: 0,
			status: false, // will be evaluated in addConstraintObj
			link: constr,
			entryLink: entry,
			// type:  will be guessed below
			isRoot: isRoot && entry.type,  // need to know if this is root-selectable for auto-select
					// entry.type suppresses categories from being put into roster
		};
		// guess the constrained object type
		if(exists(entry.import)){
			// deref if a link; SEGs don't have a 'type'
			constrObj.type = (entry.link ?? entry).type||0 ? 'SE' : 'SEG';
		}else{
			// categories (and forces) have no 'import' attr
			constrObj.type = 'category';
		}
		
		// store to the right place
		if(constr.scope === 'roster'){
			addConstraintObj(roster,storeId,constrObj);
			
		}else if(constr.scope === 'force'){
			// catch, but only store if storeForceConstr
			if(storeForceConstr){
				addConstraintObj(force,storeId,constrObj);
			}
			
		}else if(constr.scope === force.catalogue.id){
			// treating primary catalogue as local to force
			console.log('found catalogue id scoped constraint ',entry);
			if(storeForceConstr){
				addConstraintObj(force,storeId,constrObj);
			}
			
		}else if(constr.scope === 'primary-catalogue'){
			// literal primary-catalogue; treating as local to force
			if(storeForceConstr){
				addConstraintObj(force,storeId,constrObj);
			}
			
		}else if(constr.scope === force.gstLink.id){
			// treating force entry id (force type) as local to force
			console.log('found forceEntry id scoped constraint ',entry);
			if(storeForceConstr){
				addConstraintObj(force,storeId,constrObj);
			}
			
		}else if(constr.scope === 'parent'){
			// catch, but only store if storing forces and root (ctg considered root)
			if(storeForceConstr && (isRoot || constrObj.type === 'category')){
				// parent in a root entry counts as force
				addConstraintObj(force,storeId,constrObj);
			}
			
		}else if(constr.scope in roster.forces[fid].catalogue.categoryEntries){
			// at this level, only care about category scopes
			console.log('unsupported category scope '+constr.scope);
			// todo custom scopes
			
		}else{
			// cach all unexpected scopes
			// console.log('Unsupported scope: '+constr.scope+' in '+entry.name+', '+entry.id);
		}
	});
	
	
	// run through children SE, SEG, and links (but don't actually follow links)
	let children = (entry.entryLinks ?? [])
				.concat( entry.selectionEntries ?? [] )
				.concat( entry.selectionEntryGroups ?? [] );
	
	// recursively call all children
	children.forEach(childEntry => {
		getConstraintsRec(fid,childEntry,false,storeForceConstr);
	});
	
}

// process an array of constraints, currently storing only 'parent' scopes
function processParentConstr(rosterParent,constrArr){
	
	// get a force reference;
	const force = parentForce(rosterParent);
	
	// contains an array of constraints wrapped with other info
	constrArr.forEach(constrWr => {
		// unwrap
		const entry = constrWr.entry;
		const constr = constrWr.constraint;
		
		// store under targetId if a link
		const storeId = entry.targetId ?? entry.id;
		
		// parse and store a few points
		let constrObj = {
			count: 0,
			status: false,	// will be evaluated by addConstraintObj
			link: constr,
			entryLink: entry,
			// type, isRoot, rosterLink
		};
		// guess the constrained object type
		if(exists(entry.import)){
			// deref if a link; SEGs don't have a 'type'
			constrObj.type = (entry.link ?? entry).type||0 ? 'SE' : 'SEG';
		}else{
			// categories have no 'import' attr
			constrObj.type = 'category';
			console.log('unexpected category constraint in child selection');
		}
		
		// store to the right place
		// 'parent' of a manually entered id of the parent
		if(constr.scope === 'parent' 
				|| constr.scope === rosterParent.link.id 
				|| constr.scope === rosterParent.link.targetId){
					
			addConstraintObj(rosterParent,storeId,constrObj);
			
		}else if(constr.scope === 'force'){
			// already captured
			
		}else if(constr.scope === 'roster'){
			// already captured
			
		}else if(constr.scope === force.catalogue.id){
			// already captured
			
		}else if(constr.scope === 'primary-catalogue'){
			// already captured
			
		}else if(constr.scope === force.gstLink.id){
			// already captured
			
		}else{
			// see if scope is ancestral
			let foundScope = false;
			let searchScope = rosterParent;
			
			// check up the chain
			while(searchScope.parent){
				
				// go ahead and step up first
				searchScope = searchScope.parent;
				
				// check this parent
				if(constr.scope === searchScope.link?.id || constr.scope === searchScope.link?.targetId){
					// add the constraint here
					addConstraintObj(searchScope,storeId,constrObj);
					foundScope = true;
					console.log('Found ancestral constraint in '+searchScope.name);
				}
			}
			
			
			// did we find it?
			if(!foundScope){
				console.log('Unsupported scope: '+constr.scope+' in ',entry);
			}
			
		}
	});
	
}

// convenience, add a constraint to the scoped list
function addConstraintObj(scope,storeId,constrObj){
	
	// format of the constrObj:
	/* {
		count: int,  current count in roster
		status: bool, is the constraint passing, will be evaluated now
		link: {},  catalogue entry of constr
		entryLink: {},  catalogue entry of constrained entry
		type:  str,  type of entry, SE,SEG,category
		isRoot: bool,  is this root-selectable for auto-select
		rosterScope: {},  added here, link to the scope
	} */
	
	
	// recover the constraint itself
	const constr = constrObj.link;
	
	// modify the original constraint
	if(typeof constr.value === 'string'){
		constr.value = parseInt(constr.value);
		constr.includeChildSelections = constr.includeChildSelections === 'true';
		constr.includeChildForces = constr.includeChildForces === 'true';
	}
	
	// create if it doesn't exist
	if(!scope.constraints[storeId])
		scope.constraints[storeId] = [];
	
	// add a link to the roster scope in the constrObj
	constrObj.rosterScope = scope;
	
	// check if a repeat
	if(scope.constraints[storeId].filter(c => c.link.id === constr.id).length > 0)
		return;
	
	// query for existing entries (from other forces)
	// only possible for roster scopes at this stage
	if(constr.scope === 'roster'){
		// parameter object for query
		const queryParams = {
			scope: 'roster',
			rosterLink: scope,
			id: constrObj.entryLink.id,
			icf: constr.includeChildForces,	// convert to bool
			ics: constr.includeChildSelections
		};
		constrObj.count = query(queryParams);
	}
	
	
	// check if current state is satisfied
	constrObj.status = checkConstraint(constrObj);
	
	// store the object
	scope.constraints[storeId].push(constrObj);
}

// hold constraint evaluation logic in one place
function checkConstraint(constrObj){
	
	// scale by parent quantity when evaluating
	const scaleFactor = (constrObj.rosterScope.quantity ?? 1);
	
	// threshold, allowing for modifiers
	const thr = constrObj.value ?? constrObj.link.value;
	
	// check if current state is satisfied
	// both min and max are inclusive
	if(constrObj.link.type==='min'){
		return constrObj.count/scaleFactor >= thr;
		
	}else if(constrObj.link.type==='max'){
		// -1 in max implies no limit
		if(thr === -1){
			return true;
		}
		return constrObj.count/scaleFactor <= thr;
		
	}else{
		console.log('Unexpected constraint type: '+constrObj.link.type);
	}
}

// update the counts of all relevant constraints
var lastConstr;
function emitConstraints(rosEntry,quant){
	// emits targets (ids, ctgs, of this entry) to listeners (constr, conds, etc)
	
	lastEntry = rosEntry;
	
	// get the force
	const force = parentForce(rosEntry);
	let isForce = rosEntry.catalogue || 0;
	
	// begin collecting all potential target ids
	let cstrIdArr = isForce? [rosEntry.gstLink.id] : [];
	if(!isForce){
		
		// emit to both link and shared ids
		const targetIds = [rosEntry.link.id].concat(rosEntry.link.targetId ?? []);
		
		// split up the entryId
		let idPath = rosEntry.entryId.split(':');
		// remove the repeat of last entryId
		idPath.pop();
		// check that the first element isn't the target of a parent link
		if(idPath.length > 0){
			let firstElem = idPath.shift();
			// if not a repeat, put back on stack
			if(firstElem !== rosEntry.parent.link.targetId)
				idPath.push(firstElem);
		}
		
		// also add unit,model,upgrade,anything generic tags
		const unitType = rosEntry.link.link?.type ?? rosEntry.link.type;
		
		// add all ctgs, eliminating repeats
		const allCtg = (rosEntry.link.link?.categoryLinks ?? []).map(c => c.targetId)
						.concat((rosEntry.link.categoryLinks ?? []).map(c => c.targetId));
		// use set to remove duplicates
		const uniqueCtgs = [...new Set(allCtg)];
		
		// compile all relevant ids: entity + all entities (SEGs) on path from parent + all ctgs
		cstrIdArr = [unitType, 'anything'].concat(idPath).concat(targetIds).concat(uniqueCtgs);
		
		
	}
	
	// todo, ics handling
	
	// run through all the ids to emit (potential target counts to increment)
	cstrIdArr.forEach(cid => {
		
		// emit to the full ancestry of listeners (includes force)
		let allConstr = roster.constraints?.[cid] ?? [];
		let rosScope = rosEntry;
		while(rosScope.parent){
			rosScope = rosScope.parent;
			// if exists, add to list
			allConstr = allConstr.concat(rosScope.constraints?.[cid] ?? []);
		}
		
		// update each constraint
		allConstr.forEach(constr => {
			
			lastConstr = constr;
			
			// update the count
			constr.count += quant;
			// update the status
			constr.status = checkConstraint(constr);
		});
		
		
		// emit also to conditions
		
		//reset scope
		rosScope = rosEntry;
		// start off with roster and force
		let allCond = (roster.conditions?.[cid] ?? [])
						.concat(force.conditions?.[cid] ?? []);
		
		// emit to full ancestry (includes self but not force)
		while(rosScope.parent){
			
			allCond = allCond.concat(rosScope.conditions?.[cid] ?? []);
			// update after, to catch self
			rosScope = rosScope.parent;
		}
		
		
		// update each condition
		allCond.forEach(cond => {
			// update the count
			cond.count += quant;
			
			// update the status
			const oldStatus = cond.status;
			cond.status = checkCondition(cond);
			
			// propagate changes to chained conditions or modifiers
			if(oldStatus !== cond.status)
				propagateConditionStatus(cond);
		});
		
	});
}

// check if a root entry has already reached it's max constraint (but not necessarily exceeding)
function checkMax(entry,fid){
	
	// get constraints, respecting modifiers, force scoped
	const constrSum = getModifiedConstraints(entry,roster.forces[fid]);
	
	// return result
	return constrSum.remaining <= 0;
}

// evaluate if multiple selections of a catalogue entry should merge
function evaluateMerging(catEntry,rosterScope){
	// get all the SE and SEGs
	opts = compileSelectableOptions(catEntry,rosterScope,true);
	/* opts contains: {
		SE: [{path,entry}],
		SEG: [{}],
		[path]: '',
		[parentSEG]: {}
	} */
	
	// parent or link having any SEG should not merge
	const hasSEG = opts.SEG.length > 0;
	
	// evaluate constraints of each SE
	let unconstrainedSE = false;
	let mismatchedMinMax = false;
	opts.SE.forEach(SEwr => {
		
		let SE = SEwr.entry;
		let constrArr = SE.constraints || [];
		if(SE.link && SE.link.constraints)
			constrArr = constrArr.concat(SE.link.constraints);
		// dont merge parent if any child SE is unconstrained
		unconstrainedSE |= constrArr.length === 0;
		
		// compare mins and maxs (what if this changes with modifiers?)
		// ignoring scopes for now
		let min = Infinity;
		let max = 0;
		constrArr.forEach(c => {
			// get the lowest min
			if(c.type === 'min' && parseInt(c.value) < min)
				min = parseInt(c.value);
			// and highest max
			if(c.type === 'max' && parseInt(c.value) > max)
				max = parseInt(c.value);
		});
		
		// don't merge if there's options in how to take
		mismatchedMinMax = min !== max;
		
	});
	
	
	if(hasSEG || unconstrainedSE || mismatchedMinMax){
		// apply to entry and linked entry, in false case only
		catEntry.merge = false;
		if(catEntry.link||0)
			catEntry.link.merge = false;
	}else{
		// don't apply to shared entry, since using possible link constraints
		catEntry.merge = true;
	}
	
	// now repeat for all children, drilling into SEGs too
	// move to the top, evaluate children first so we can check if they're non-merging
	function callChildren(opt){
		// call on all SE
		opt.SE.forEach(SE => {
			if(!exists(SE.entry.merge))
				evaluateMerging(SE.entry,rosterScope);
		});
		// call this function on any SEGs
		opt.SEG.forEach(SEG => {
			callChildren(SEG);
		});
	}
	callChildren(opts);
	
}

// evaluate if multiple selections of a catalogue entry should merge, respecting 'collective'
function evaluateMerging2(catEntry,rosterScope){
	// get all the SE and SEGs
	opts = compileSelectableOptions(catEntry,rosterScope,false);
	/* opts contains: {
		SE: [{path,entry}],
		SEG: [{}],
		[path]: '',
		[parentSEG]: {}
	} */
	
	// drill into immediately selectable SEGs, then first evaulate merging of deepest entries
	function callChildren(opt){
		
		let mergeParent = true;
		
		// dig depth-first
		opt.SEG.forEach(SEG => {
			callChildren(SEG);
			mergeParent &= SEG.parentSEG.mergeParent;
		});
		
		// call on all SE
		opt.SE.forEach(SE => {
			if(!exists(SE.entry.merge))
				evaluateMerging2(SE.entry,rosterScope);
			
			mergeParent &= SE.entry.mergeParent;
		});
		
		
		// store result into parentSEG if provided, or return to calling entry
		if(opt.parentSEG){
			opt.parentSEG.mergeParent = mergeParent;
		}else{
			return mergeParent;
		}
		
	}
	
	// merging this entry determined by its childreb
	catEntry.merge = callChildren(opts);
	
	
	// parent can only merge if children do
	let pMerge = catEntry.merge;
	
	// flatOpts.forEach(SE => {
		// do not merge if children are optional (represents a user choice) unless also collective 
		
		// grab both lnik and shared constr
		let constrArr = (catEntry.constraints ?? []).concat(catEntry.link?.constraints ?? []);
		
		// dont merge entry if it is unconstrained
		const unconstrained = constrArr.length === 0;
		
		// compare unmodified mins and maxs (what if this changes with modifiers?)
		// ignoring scopes for now
		let min = Infinity;
		let max = 0;
		constrArr.forEach(c => {
			// get the lowest min
			if(c.type === 'min' && parseInt(c.value) < min)
				min = parseInt(c.value);
			// and highest max
			if(c.type === 'max' && parseInt(c.value) > max)
				max = parseInt(c.value);
		});
		
		// don't merge if there's options in how to take
		const mismatchedMinMax = min !== max;
		
		// is the entry collective
		const isCollective = catEntry.collective === 'true' || catEntry.link?.collective === 'true';
		
		// finally apply mergability
		pMerge &= isCollective || (!unconstrained && !mismatchedMinMax);
		
	// });
	
	catEntry.mergeParent = pMerge;
	
}


// see if an entry is hidden, respecting modifiers
function getModifiedHidden(catEntry,rosLink){
	
	//debug
	if(!catEntry){
		console.log('undefined input ',lastEntry);
	}
	lastEntry = catEntry;
	
	// is the roster link a force
	const isForce = rosLink.catalogue || 0;
	// is it a link
	const isLink = catEntry.targetId && catEntry.link;
	// is it a categoryLink
	const isCtgLink = !!catEntry.primary;
	// get the force
	const force = parentForce(rosLink) ?? {};
	
	// track its status, starting with catalogue set value
	let isHidden = catEntry.hidden === 'true';
	
	// hacky; ctg need to use targetId, but aren't linked
	let searchId = catEntry.id;
	if(isCtgLink)
		searchId = catEntry.targetId;
	
	
	// look for modifiers in full ancestry
	let currentScope = rosLink;
	
	let modArr = [];
	
	// Look up ancestry
	while(currentScope.parent){
		modArr = modArr.concat((currentScope.modifiers?.[searchId] ?? [])
					.filter(m => m.status && m.field === 'hidden'));
		
		// if no parent, will fail while loop as well
		currentScope = currentScope.parent ?? currentScope;
	}
	
	// run manually on force
	modArr = modArr.concat((force.modifiers?.[searchId] ?? [])
				.filter(m => m.status && m.field === 'hidden'));
	
	
	// run through the list of active mods, and apply (true or false) in order
	modArr.forEach(activeMod => {
		isHidden = activeMod.link.value === 'true';
	});
	
	// if a link, also check that the target is still valid
	// either link or shared can hide, both need to be unhidden to show
	if(isLink && !isCtgLink){
		isHidden |= getModifiedHidden(catEntry.link,rosLink);
	}
	
	// debug
	// if(isHidden != origValue){
		// const hidTxt = isHidden? '' : 'Not ';
		// console.log((catEntry.link ?? catEntry).name+' modified to '+hidTxt+'Hidden');
	// }
	
	return isHidden;
}

// get an entry's prime ctg, respecting modifiers
function getModifiedPrimeCtg(catEntry,rosLink){
	lastEntry = catEntry;
	
	// is the roster link a force
	const isForce = rosLink.catalogue || 0;
	// is it a link
	// const isLink = catEntry.targetId || 0;
	const isLink = catEntry.targetId && catEntry.link;
	// get the force
	const force = parentForce(rosLink) ?? {};
	
	// find the starting value (might be undefined)
	let primeCtg = catEntry.primeCtg;
	let origValue = primeCtg;
	
	// look for modifiers
	let modArr = (force.modifiers?.[catEntry.id] ?? [])
					.filter(m => m.status && m.field === 'category');
	// for not forces, also check in the roster parent scope
	if(!isForce){
		modArr = modArr.concat((rosLink.modifiers?.[catEntry.id] ?? [])
					.filter(m => m.status && m.field === 'category'));
	}
	
	// run through the list of active mods, and apply in order
	modArr.forEach(activeMod => {
		// further filter on set vs unset primary
		if(activeMod.link.type === 'set-primary'){
			primeCtg = activeMod.link.value;
			
		}else if(activeMod.link.type === 'unset-primary'){
			primeCtg = undefined;
			
		}else if(activeMod.link.type !== 'add' && activeMod.link.type !== 'remove'){
			// add/remove not of interest here
			console.log('Unexpected modifier type '+activeMod.link.type+' in ',catEntry);
		}
	});
	
	// if a link, also check the shared entry
	if(isLink){
		primeCtg = primeCtg ?? getModifiedHidden(catEntry.link,rosLink);
	}
	
	// if no prime category, plug in default value
	if(!primeCtg)
		primeCtg = 'uncategorized';
	
	return primeCtg;
}

// get an entry's name, respecting modifiers
function getModifiedName(catEntry,rosLink){
	// note rosLink is the closest roster scope, either self or parent of SE
	
	// is the roster link a force
	const isForce = rosLink.catalogue || 0;
	// is it a link
	const isLink = catEntry.targetId && catEntry.link;
	// is it a categoryLink
	const isCtgLink = !!catEntry.primary;
	// get the force
	const force = parentForce(rosLink) ?? {};
	
	// immediately grab linked value
	let name = catEntry.link?.name ?? catEntry.name;
	
	// hacky; ctg need to use targetId, but aren't linked
	let searchId = catEntry.id;
	if(isCtgLink)
		searchId = catEntry.targetId;
	
	
	// look for modifiers in full ancestry
	let currentScope = rosLink;
	// let modArr = (force.modifiers?.[catEntry.id] ?? [])
					// .filter(m => m.status && m.field === 'name');
	let modArr = [];
	
	// force one run, then on up ancestry
	while(currentScope.parent){
		modArr = modArr.concat((currentScope.modifiers?.[searchId] ?? [])
					.filter(m => m.status && m.field === 'name'));
		
		currentScope = currentScope.parent ?? currentScope;
	}
	
	// run manually on force
	modArr = modArr.concat((force.modifiers?.[searchId] ?? [])
				.filter(m => m.status && m.field === 'name'));
				
	
	// run through the list of active mods, and apply in order
	modArr.forEach(activeMod => {
		if(activeMod.link.type === 'set'){
			name = activeMod.link.value;
		}else if(activeMod.link.type === 'append'){
			name = name+' '+activeMod.link.value;
		}else{
			console.log('Unexpected modifier operation to name: '+activeMod.link.type);
		}
	});
	
	// if a link, also check the target
	if(isLink  && !isCtgLink){
		// get the modified shared entry name
		const shareName = getModifiedName(catEntry.link,rosLink);
		// did that one change?
		const shareNameChange = shareName !== catEntry.link.name;
		// name precedence is sharedEntry < modified link < modified shared
		name = shareNameChange ? shareName : name;
	}
	
	return name;
}

// get constraints of an entry, respecting modifiers
var lastConstrArr;
function getModifiedConstraints(catEntry,rosLink){
	
	// is the roster link a force
	const isForce = rosLink.catalogue || 0;
	// is it a link
	const isLink = catEntry.targetId  && catEntry.link;
	// get the force
	const force = parentForce(rosLink) ?? {};
	
	// make a return object
	let constrSum = {
		min: true,	// if the min is being met
		max: true, // if being met
		minQuant: 0,  // actual numeric threshold
		maxQuant: Infinity,
		remaining: Infinity,  // how many more can be selected to reach lowest max
	};
	
	// targetId of the constraint
	const targetId = catEntry.targetId ?? catEntry.id;
	
	
	// look for modifiers in full ancestry
	let currentScope = rosLink;
	// start off with roster scope
	let constrArr = roster.constraints?.[targetId] ?? [];
	
	
	// Look up ancestry (including force) for constraints
	while(currentScope.parent || currentScope.catalogue){
		// collect constraints at this scope
		let newConstrs = currentScope.constraints?.[targetId] ?? [];
		
		// add to list
		constrArr = constrArr.concat(newConstrs);
		
		// if no parent, it's a force
		currentScope = currentScope.parent ?? roster;
	}
	
	// run manually on force
	// constrArr = constrArr.concat(force.constraints?.[targetId] ?? []);
	
	
	// iterate over constraints
	lastConstrArr = constrArr;
	constrArr.forEach(constr => {
		// current threshold
		const currentThr = constr.link.value;
		let modThr = currentThr;
		
		// apply any active modifiers to this constraint
		if(constr.modifiers){
			constr.modifiers.filter(m => m.status).forEach(mod => {
				
				// evaluate mods
				if(mod.link.type === 'increment'){
					modThr += mod.repeat;
					
				}else if(mod.link.type === 'decrement'){
					modThr -= mod.repeat;
					
				}else if(mod.link.type === 'set'){
					modThr = parseInt(mod.link.value);
					
				}else{
					console.log('Unexpected modifier type: '+mod.link.type);
				}
				
			});
		}
		
		// -1 implies unlimited, apply only to max constr for now
		if(modThr === -1 && constr.link.type === 'max')
			modThr = Infinity;
		
		// parent quantity, for scaling
		const pQuant = (constr.rosterScope.quantity ?? 1);
		// remaining room in this constraint
		const deltaMax = modThr - constr.count/pQuant;
		
		// apply modified values to overall summary
		if(constr.link.type === 'max'){
			// tracking the min max thresh and constr status
			constrSum.maxQuant = Math.min(constrSum.maxQuant,modThr);
			// scale by parent quantity
			constrSum.max &= constr.count/pQuant <= modThr;
			// track the fewest allowable selections to a constraint
			constrSum.remaining = Math.min(constrSum.remaining,deltaMax);
			
		}else if(constr.link.type === 'min'){
			// tracking the max min thresh and constr status
			constrSum.minQuant = Math.max(constrSum.minQuant,modThr);
			// scale by parent quantity
			constrSum.min &= constr.count >= modThr*(rosLink.parent?.quantity ?? 1);
		}else{
			console.log('unexpected constraint type '+constr.link.type);
		}
		
	});
	
	
	return constrSum;
	
}

// apply modifiers to a single constr, returning a copied obj of similar form
function getModifiedSingleConstr(constr){
	
	// make a shallow copy of the original constr
	let modConstr = {};
	Object.keys(constr).forEach(key => {
		modConstr[key] = constr[key];
	});
	
	// current threshold
	let modThr = constr.link.value;
	
	// apply any active modifiers to this constraint
	(constr.modifiers ?? []).filter(m => m.status).forEach(mod => {
		
		// evaluate mods
		if(mod.link.type === 'increment'){
			modThr += mod.repeat * parseInt(mod.link.value);
			
		}else if(mod.link.type === 'decrement'){
			modThr -= mod.repeat * parseInt(mod.link.value);
			
		}else if(mod.link.type === 'set'){
			modThr = parseInt(mod.link.value);
			
		}else{
			console.log('Unexpected constraint modifier type: '+mod.link.type);
		}
		
		// safety
		if(isNaN(modThr))
			console.log('Found non-numeric constraint in '+constr.entryLink.id+', '+constr.entryLink.name);
		
	});
	
	// store the modified threshold
	modConstr.value = modThr;
	
	
	// reevaluate the status
	modConstr.status = checkConstraint(modConstr);
	
	return modConstr;
}

// apply modifiers to a selection cost
function getModifiedCost(catEntry,rosLink){
	
	// is the roster link a force
	const isForce = rosLink.catalogue || 0;
	// is it a link
	const isLink = catEntry.targetId && catEntry.link || 0;
	// is it a categoryLink
	const isCtgLink = !!catEntry.primary;
	// get the force
	const force = parentForce(rosLink) ?? {};
	
	const searchId = catEntry.id;
	
	// cost object
	let costs = {};
	(catEntry.costs ?? []).forEach(cost => {
		costs[cost.typeId] = {
			value: parseInt(cost.value),
			name: cost.name,
		};
	});
	
	// is any cost non-zero? (but not unedfined)
	const nonzeroCost = Object.values(costs).some(c => c.value && c.value !== 0);
	
	// grab linked value, but store separately
	let shareCosts = {};
	(catEntry.link?.costs ?? []).forEach(cost => {
		shareCosts[cost.typeId] = {
			value: parseInt(cost.value),
			name: cost.name,
		};
		
		// ensure link costs at least define this cost type
		if(!costs[cost.typeId]){
			costs[cost.typeId] = {
				value: 0,
				name: cost.name,
			};
		}
	});
	
	
	
	
	// look for modifiers in full ancestry
	let currentScope = rosLink;
	let modArr = [];
	
	// force one run, then on up ancestry
	while(currentScope.parent){
		modArr = modArr.concat((currentScope.modifiers?.[searchId] ?? [])
					.filter(m => m.status && m.fieldType === 'cost'));
		
		currentScope = currentScope.parent ?? currentScope;
	}
	
	// run manually on force
	modArr = modArr.concat((force.modifiers?.[searchId] ?? [])
				.filter(m => m.status && m.fieldType === 'cost'));
	
	
	// run through the list of active mods, and apply in order
	modArr.forEach(mod => {
		// check if we recognize it
		if(!(mod.field in costs))
			console.log('Unexpected cost type: '+mod.field+' in modifier to '+catEntry.id+', '+catEntry.name);
		
		if(mod.link.type === 'increment'){
			costs[mod.field].value += mod.repeat * parseInt(mod.link.value);
			
		}else if(mod.link.type === 'decrement'){
			costs[mod.field].value -= mod.repeat * parseInt(mod.link.value);
			
		}else if(mod.link.type === 'set'){
			costs[mod.field].value = parseInt(mod.link.value);
			
		}else{
			console.log('Unexpected modifier operation to cost: '+mod.link.type);
		}
	});
	
	// if a link, also check the target
	if(isLink  && !isCtgLink){
		
		// store a copy of the link costs
		const linkCosts = costs;
		// were any mods applied to the link cost?
		const linkMods = modArr.length > 0;
		
		// get the modified shared entry costs
		const modShareCosts = getModifiedCost(catEntry.link,rosLink);
		
		// did any cost type of the shared entry change?
		let shareCostMods = false;
		
		Object.keys(modShareCosts).forEach(costType => {
			// const catCost = catEntry.link.costs.filter(c => c.typeId === costType)[0];
			shareCostMods |= modShareCosts[costType].value !== shareCosts[costType]?.value;
		});
		
		// precedence is sharedEntry < link(if !=0) < modified link < modified shared
		if(shareCostMods){
			costs = modShareCosts;
			
		}else if(linkMods){
			costs = linkCosts;
			
		}else if(nonzeroCost){
			costs = linkCosts;
			
		}else{
			costs = shareCosts;
		}
		
		// costs = shareCostMods ? shareCosts : costs;
	}
	
	return costs;
	
}

// add a selection to the roster
var lastSelection;
function addSelection(newSelect){
	// expecting params of form:
	/* { entry: catalogue entry link
		parent: parent entry in roster
		[quantity]: how many
		[catPath]: path from the parent to current entry in the catalogue
		[autoSelect]: bool, default true, should we autoselect children
	} */
	lastSelection = newSelect;
	
	// prepare add to roster
	const UID = makeid(6);
	let rosterParams = {
		entryId: newSelect.entry.id,
		id: UID,
		name: newSelect.entry.name,
		link: newSelect.entry,
		quantity: 1,
		parent: newSelect.parent,  // direct link to roster parent
		collapse: true,		// default for new additions
	};
	
	// get containing force
	const force = parentForce(newSelect.parent);
	
	// take the linked entry's name, if available
	if(newSelect.entry.link || 0)
		rosterParams.name = newSelect.entry.link.name;
	
	// change quantity if supplied
	if(exists(newSelect.quantity)){
		// abort if zero or negative
		if(newSelect.quantity < 1)
			return;
		rosterParams.quantity = newSelect.quantity;
	}
	
	// add nested id if a path supplied
	if(exists(newSelect.catPath) && newSelect.catPath.length > 0)
		rosterParams.entryId = newSelect.catPath + ':' + rosterParams.entryId;
	
	if(newSelect.catPath === ':' || rosterParams.entryId.substr(0,1)===':')	// debug
		console.log('catPath of ":" in '+rosterParams.name+', '+newSelect.entry.id);
	
	// add selection group if needed
	if(!exists(newSelect.parent.selections))
		newSelect.parent.selections = {};
	
	// if not yet (done once per catalogue entry) evaluate the merge-ability of it and its children
	if(!exists(newSelect.entry.merge)){
		
		// carry out in force scope, since directly modifying catalogue
		evaluateMerging2(newSelect.entry,force);
		
		// never merge for root selectable entries
		if(exists(newSelect.parent.catalogue))
			newSelect.entry.merge = false;
	}
	
	// make multiple entries if a non-merging selection
	if(!newSelect.entry.merge && rosterParams.quantity > 1){
		// split into multiple calls (this one will still complete)
		const extraCalls = rosterParams.quantity-1;
		rosterParams.quantity = 1;
		newSelect.quantity = 1;
		for(let k=0; k<extraCalls; k++)
			addSelection(newSelect);
	}
	
	// add selection into roster scope
	newSelect.parent.selections[UID] = rosterParams;
	const rosterLink = newSelect.parent.selections[UID];
	
	// update the constraint counts
	emitConstraints(rosterParams,rosterParams.quantity);
	
	// process sub-selections
	if(newSelect.autoSelect ?? true){
		autoSelect({scope: 'selection',
			sid: UID,
			rosLink: rosterLink});
	
	}else{
		// still need to process constraints of children
		let scope = rosterLink;
		let cstrArr = {SE:[],SEG:[]};
		findChildConstr({entry:scope.link, path:'', type:'root'},cstrArr);
		
		// make a constraints object in roster
		scope.constraints = {};
		// process any found 'parent' scope constraints
		processParentConstr(scope,cstrArr.SE);
		processParentConstr(scope,cstrArr.SEG);
		
	}
	
	// check if this entry can merge into another entry
	if(newSelect.entry.merge)
		mergeRoster(rosterLink);
	
	// get preview modifiers for next children, and remaining mods for self
	getNewSelectModifiers(rosterLink);
	
	// return a reference
	return rosterLink;
}

// update the quantity and call on all children
function changeSelectionQuantity(entry,newQuant){
	
	const oldQuant = entry.quantity;
	// commit the change
	entry.quantity = newQuant;
	// emit constraints of delta
	emitConstraints(entry,newQuant-oldQuant);
	
	// update children
	if(entry.selections||0){
		Object.keys(entry.selections).forEach(childKey => {
			let child = entry.selections[childKey];
			// get the old per-parent unit amount
			const childScale = child.quantity / oldQuant;
			// update to the new amount
			changeSelectionQuantity(child,newQuant*childScale);
		});
	}
}

// remove a selection from the roster
function removeSelection(rosEntry){
	
	// recursively emit negative constraints for all children
	function recEmitNegative(rosE){
		// run through child selections, if any
		Object.values(rosE.selections ?? {}).forEach(child => {
			// recurse first
			recEmitNegative(child);
		});
		// then emit updates, exactly negative of existing quant
		emitConstraints(rosE,-1*rosE.quantity);
	}
	
	// launch recursion
	recEmitNegative(rosEntry);
	
	// then delete entire node from roster
	// special handling for forces
	if(rosEntry.catalogue || 0){
		const fid = rosEntry.id;
		// if a force
		delete roster.forces[fid];
		
		// also delete the display info
		delete display.left[fid];
		delete display.center[fid];
		
		// regenerate the roster-scoped constraints
		delete roster.constraints;
		Object.keys(roster.forces).forEach(fid => {compileForceConstraints(fid,false);});
		
	}else{
		// otherwise this is an entry
		// remove entire node from roster (needs the redirect to trigger)
		delete rosEntry.parent.selections[rosEntry.id];
	}
}

// auto-select entries based on min constraint
function autoSelect(newItem){
	
	if(newItem.scope === 'force'){
		
		const force = newItem.rosLink;
		
		// use compiled constraints of roster and this force
		const allConstraints = Object.values(roster.constraints).concat(Object.values(force.constraints));
		allConstraints.forEach(constrArr => {
			
			constrArr.forEach(constrObj => {
				// if status unsatisfied, is root-selectable, is explicitly an SE, and a min
				if(!constrObj.status && constrObj.isRoot 
						&& constrObj.type === 'SE' && constrObj.link.type === 'min'){
					
					addSelection({
						entry: constrObj.entryLink,
						quantity: constrObj.link.value-constrObj.count,
						parent: force
					});
				}
			});
			
		});
		
		
	}else if(newItem.scope === 'selection'){
		
		// scope is directly linked into roster
		let scope = newItem.rosLink;
		
		// recursively add children with mins (from cat entry)
		let cstrArr = {SE:[],SEG:[]};
		findChildConstr({entry:scope.link, path:'', type:'root'},cstrArr);
		
		// make a constraints object in roster
		scope.constraints = {};
		// process any found 'parent' scope constraints
		processParentConstr(scope,cstrArr.SE);
		processParentConstr(scope,cstrArr.SEG);
		
		
		// add SEs first
		cstrArr.SE.forEach(SE => {
			// only add min 'parent' scopes at this time
			if(SE.constraint.scope === 'parent' && SE.constraint.type === 'min'){
				// get the right id
				const checkId = SE.entry.targetId ?? SE.entry.id;
				// roster constraints are inside an array, simply loop over them all
				scope.constraints[checkId].filter(c => c.link.type === 'min').forEach(constrObj => {
					// add the appropriate amount
					const quant = (constrObj.link.value-constrObj.count)*scope.quantity;
					addSelection({
						entry: constrObj.entryLink,
						quantity: quant,
						parent: scope,
						catPath: SE.path,	// inject path
					});
				});
			}
		});
		
		
		// then fill remaining spots with SEG default
		cstrArr.SEG.forEach(SEG => {
			
			// find the default entry of the SEG
			let defaultId = 0;
			if(SEG.entry.defaultSelectionEntryId){
				defaultId = SEG.entry.defaultSelectionEntryId;
			}else if(SEG.entry.link?.defaultSelectionEntryId){
				defaultId = SEG.entry.link?.defaultSelectionEntryId;
			}
			
			if(SEG.constraint.type === 'min' && defaultId){
				// get the right id
				const checkId = SEG.entry.targetId ?? SEG.entry.id;
				
				
				// defaultId assumed to point to an immediate child SE of this or the shared entry
				let SEGchildren = (SEG.entry.selectionEntries ?? []).concat(SEG.entry.entryLinks ?? [])
							.concat(SEG.entry.link?.selectionEntries ?? [])
							.concat(SEG.entry.link?.entryLinks ?? []);
				
				// filter to expected id
				let defaultEntry = SEGchildren.filter(SE => SE.id === defaultId);
				if(defaultEntry.length === 1){
					// now add to roster
					defaultEntry = defaultEntry[0];
					
					// roster constraints are inside an array, simply loop over them all
					// auto-select on anything that got stored to the parent
					(scope.constraints[checkId] ?? []).filter(c => c.link.type === 'min').forEach(constrObj => {
						// add the appropriate amount
						const quant = (constrObj.link.value-constrObj.count)*scope.quantity;
						
						// make an appropriate path string
						let pathStr = SEG.path+':'+SEG.entry.id+(SEG.entry.targetId? ':'+SEG.entry.targetId : '');
						if(pathStr.substr(0,1) === ':')
							pathStr = pathStr.substr(1);
						
						addSelection({
							entry: defaultEntry,
							quantity: quant,
							parent: scope,
							catPath: pathStr,	// inject path
						});
					});
					
				}else{
					console.log('Found '+defaultEntry.length+' matches of defaultId '+defaultId+' in '
							+'SEG '+SEG.entry.id+' ('+SEG.entry.name+')');
				}
			}
		});
		
	}
}

var childrenSearched
// recursively add min-constrained children of provided node
function findChildConstr(params,foundMins){
	// let foundMins = [];
	const entry = params.entry;
	// const selectionTypes = ['selectionEntries','entryLinks','selectionEntryGroups'];
	lastEntry = params.entry;	//debug
	
	// extend the path, but don't include the root entry
	let newPath = '';
	if(params.type !== 'root'){
		newPath = params.path.length === 0 ? entry.id : params.path + ':' + entry.id;
	}
	
	// for the current SEG, check this items constraints
	if(params.type==='SEG' && exists(entry.constraints)){
		entry.constraints.forEach(constr => {
				
			// add all constraints to the list
			foundMins.SEG.push({ 	// only SEG should reach this point
				path: params.path, // path to parent
				entry: entry,
				constraint: constr
			});
		});
	}
	
	// collect all child SE and SE links
	let SEarr = entry.selectionEntries ?? [];
	
	if(exists(entry.entryLinks))
		SEarr = SEarr.concat(entry.entryLinks.filter(EL => EL.type === 'selectionEntry'));
	
	// for SE we only check for constraints, but do not follow further children (except links)
	SEarr.filter(SE => exists(SE.constraints)).forEach(SE => {
		
		SE.constraints.forEach(constr => {
			// add all to the list
			foundMins.SE.push({
				path: newPath, // path to parent
				entry: SE, // the child selection
				constraint: constr
			});
		});
	});
	// check links as well
	SEarr.filter(SE => (exists(SE.link) && exists(SE.link.constraints)))
		.forEach(SE => {
		
		SE.link.constraints.forEach(constr => {
			// add the link to the list
			foundMins.SE.push({
				path: newPath, 	// current entry is parent of link
				entry: SE,		// add the link, not the shared entry
				constraint: constr
			});
		});
	});
	
	
	// collect all child SEG and SEG links
	let SEGarr = entry.selectionEntryGroups ?? [];
	
	if(exists(entry.entryLinks))
		SEGarr = SEGarr.concat(entry.entryLinks.filter(EL => EL.type === 'selectionEntryGroup'));
	
	// for SEG, call this function recursively
	SEGarr.forEach(SEG => {
		// concat results to build up full list
		const newParams = {entry:SEG, path:newPath, type:'SEG'};
		findChildConstr(newParams,foundMins);
	});
	
	// check if the entry itself is a link (could be to SE or SEG)
	if(exists(entry.link)){
		// continue search at linked entry
		// need to pass some forward some indication of entry type
		let linkType = entry.type==='selectionEntryGroup'?'SEG':'SE';
		
		const newParams = {entry:entry.link, path:newPath, type:linkType};
		findChildConstr(newParams,foundMins);
	}
	// console.log(foundMins);
	return foundMins;
}

// attempt to merge identical roster entries
function mergeRoster(newItem){
	let siblings = newItem.parent.selections;
	
	// local, recursive deep comparison
	function deepCompare(testEntry,cmpEntry){
		if(testEntry.entryId === cmpEntry.entryId){
			if(exists(testEntry.selections) && exists(cmpEntry.selections)){
				// compare the children as well
				// sort based on entryId
				const testChildrenIds = Object.keys(testEntry.selections).sort(e=>e.entryId);
				const cmpChildrenIds = Object.keys(cmpEntry.selections).sort(e=>e.entryId);
				// quick check they have the same number of ids
				if(testChildrenIds.length !== cmpChildrenIds.length)
					return false;
				// deep-compare each child
				let allPassed = true;
				for(let k=0; k<testChildrenIds.length; k++){
					if(!deepCompare( testEntry.selections[testChildrenIds[k]],
										cmpEntry.selections[cmpChildrenIds[k]] ))
						return false;
				};
				// all children passed
				return allPassed;
			}else{
				if(exists(testEntry.selections) || exists(cmpEntry.selections)){
					// one of the two expected further children
					return false;
				}else{
					// no further children to compare
					return true;
				}
			}
		}else{
			return false;
		}
	}
	// local recursive merge of matched items. Second item is merged into the first
	/* function merge(first,second){
		// merge counts
		first.quantity += second.quantity;
		// step down both objects in parallel
		if(first.selections || 0){
			// link up children by entryId
			const firstChildrenIds = Object.keys(first.selections).sort(e=>e.entryId);
			const secChildrenIds = Object.keys(second.selections).sort(e=>e.entryId);
			// step into children
			for(let k=0; k<firstChildrenIds.length; k++){
				merge(first.selections[firstChildrenIds[k]], second.selections[secChildrenIds[k]]);
			}
		}
	} */
	
	// run comparison, excluding self
	for(let sibKey of Object.keys(siblings).filter(id => id !== newItem.id)){
		let sibling = siblings[sibKey];
		const matched = deepCompare(newItem,sibling);
		if(matched){
			// merge into this sibling, respecting constraint emitting
			console.log('merging: '+newItem.name);
			// merge(sibling,newItem);
			// assumes the ratio of child selections is the same
			changeSelectionQuantity(sibling,sibling.quantity+newItem.quantity);
			
			// delete the redundant entry, handling constraint emitting
			removeSelection(newItem);
			
			// no need to keep searching
			break;
		}
	}
}

// query current roster selections. Called recursively.
function query(params){
/* params of format: {
	scope: STRING, roster, force, parent, or custom
	[scopeId: STRING,] required if 'custom' scope
	rosterLink: OBJ, direct link into roster object scope (not required for 'roster' scope)
	id: STRING,	which selection ID to search for
	[type: STRING,] specify for SEG or force
	icf: BOOL, include child forces
	ics: BOOL, include child selections
}*/
	
	let count = 0;
	
	// plug in type if not given
	if(!exists(params.type))
		params.type = 'SE';
	
	// roster-wide, re-scope to multiple force-scoped calls
	if(params.scope === 'roster'){
		Object.keys(roster.forces).forEach(fid => {
			params.rosterLink = roster.forces[fid];
			params.scope = 'force';
			count += query(params);
		});
		// return total of all
		return count;
	}
	
	// possible scopes are roster, force, parent, and custom ID (rare, just search path?)
	let queryScope = params.rosterLink;
	// grab the catalogue entry to check 'self' scopes
	const scopeCatEntry = queryScope.link ?? {};
	
	// get force link
	const force = parentForce(queryScope);
	
	// force scope, elevate from current selection to parent force
	if(params.scope === 'force'){
		queryScope = force;
	
	// catalogue or forceEntry ids treated as force scope
	}else if(params.scope === force.catalogue.id || params.scope === force.gstLink.id){
		queryScope = force;
	
	// parent scope, elevate once
	}else if(params.scope === 'parent'){
		// provided scope is of the parent
		
	// this is 'self' scope
	}else if(params.scope === scopeCatEntry.id || params.scope === scopeCatEntry.targetId
			|| params.scope === 'self'){
		// queryScope already correct
	
	// else a custom id scope
	}else if(params.scope !== 'custom'){
		// debug
		console.log('encountered custom scope '+params.scope+' in '+queryScope.id);
		// relabel scope 
		params.scopeId = params.scope;
		params.scope = 'custom';
		
	}
	
	
	// check if each child selection matches the target id
	for(const key in (queryScope.selections ?? {})){
		// get the roster and catalogue entries of child selections
		const rosEntry = queryScope.selections[key];
		const catEntry = queryScope.selections[key].link;
		const uType = catEntry.link?.type ?? catEntry.type;
		
		// check entry and if link, linked entry
		if(catEntry.id === params.id || catEntry.targetId === params.id){
			// add current quantity
			count += rosEntry.quantity;
		
		// handle generic 'model' and 'unit' types
		}else if(uType === params.id || params.id === 'anything'){
			count += rosEntry.quantity;
			
		}else{
			// handle SEGs, which are somewhere in the path
			// is the SEG ID in the path
			const segInPath = rosEntry.entryId.split(':').some(id => id === params.id);
			
			// exclude the parent targetId which might be in path
			if(segInPath && params.id !== rosEntry.parent.link.targetId){
				count += rosEntry.quantity;
				
			}else{
				// finally, run through categories
				let ctgArr = (catEntry.categoryLinks ?? []).concat(catEntry.link?.categoryLinks ?? []);
				// if any matches the filter
				if(ctgArr.some(ctg => ctg.targetId === params.id))
					count += rosEntry.quantity;
			}
		}
		
		
		// handle ics
		if(params.ics){
			// construct a new query, with updated roster scope
			const newQueryParams = {
				scope: 'parent',
				rosterLink: rosEntry,
				id: params.id,
				icf: params.ics,
				ics: params.icf,
			}
			// run on all children
			count += query(newQueryParams);
		}
	}
	
	// count also the force id
	if(params.id === force.typeId)
		count++;
	
	//todo handle icf
	
	return count;
}

// show info modal
function showInfo(event){
	
}

// compile all the children SE and SEG
function compileSelectableOptions(catEntry,rosLink,filterHidden){
	// catEntry is the catalogue entry
	// rosLink is the roster entry to scope options for (affects modifiers)
	// filterHidden (Bool) is whether to remove hidden entries (respecting modifier status)
	
	// generic structure of response, includes link back to roster
	let options = {SE:[],SEG:[],rosterEntry:rosLink};
	// if bad input, just give generic response
	if(!exists(catEntry))
		return options;
	
	// track the partial path
	let tempPath = '';
	// placeholder for the intermediate shared entry named in path
	let pathEntry;
	
	// store any direct children before following potential link
	let linkedEL = [];
	let linkedSE = [];
	let linkedSEG = [];
	
	// if it is itself a link, follow
	if(catEntry.link || 0){
		
		// store the link's direct entries before continuing
		linkedEL = catEntry.entryLinks ?? [];
		linkedSE = catEntry.selectionEntries ?? [];
		linkedSEG = catEntry.selectionEntryGroups ?? [];
		
		// follow link
		catEntry = catEntry.link;
		// record the new shared entry id to path
		tempPath = catEntry.id;
		// store a link to the shared entry
		pathEntry = catEntry;
	}
	
	
	// first collect entryLinks
	let EL = catEntry.entryLinks ?? [];
	
	// if requested, filter out hidden entries (including hidden by mod)
	if(filterHidden){
		EL = EL.filter(el => !getModifiedHidden(el,rosLink));
		linkedEL = linkedEL.filter(el => !getModifiedHidden(el,rosLink));
	}
	// stuff into wrapper
	EL = EL.map(e => {
		return {path:tempPath, entry:e, pathEntry:pathEntry};
	});
	// append any from the parent link, also wrapped
	EL = EL.concat(linkedEL.map(e => {
			return {path:'', entry:e};
		}));
	
	
	// add direct and linked SE
	let SE = catEntry.selectionEntries ?? [];
	
	// optional filter hidden
	if(filterHidden){
		SE = SE.filter(se => !getModifiedHidden(se,rosLink));
		linkedSE = linkedSE.filter(se => !getModifiedHidden(se,rosLink));
	}
	// stuff into wrapper
	SE = SE.map(e => {
		return {path:tempPath, entry:e, pathEntry:pathEntry};
	});
	// append any from the parent link, also wrapped
	SE = SE.concat(linkedSE.map(e => {
			return {path:'', entry:e};
		}));
	// also join with linked SE and store to output	
	options.SE = SE.concat(EL.filter( e => e.entry.type === 'selectionEntry'));
	
	
	// SEG have to be collected into a temp array
	let tempSEG = catEntry.selectionEntryGroups ?? [];
	
	if(filterHidden){
		tempSEG = tempSEG.filter(seg => !getModifiedHidden(seg,rosLink));
		linkedSEG = linkedSEG.filter(seg => !getModifiedHidden(seg,rosLink));
	}
	// stuff into wrapper
	tempSEG = tempSEG.map(e => {
		return {path:tempPath, entry:e, pathEntry:pathEntry};
	});
	// append any from the parent link, also wrapped
	tempSEG = tempSEG.concat(linkedSEG.map(e => {
			return {path:'', entry:e};
		}));
	// join with linked SEG
	tempSEG = tempSEG.concat(EL.filter( e => e.entry.type === 'selectionEntryGroup'));
	
	
	// reformat SEG to include catalogue link and recursive list of children entries
	tempSEG.forEach(SEG => {
		
		let SEGobj = compileSelectableOptions(SEG.entry,rosLink,filterHidden);
		
		// add path from parent
		SEGobj.path = SEG.path;
		// add link to intermediate sharedEntry, if any
		SEGobj.pathEntry = SEG.pathEntry; // might be undefined
		// tack on parent info
		SEGobj.parentSEG = SEG.entry;
		
		options.SEG.push(SEGobj);
	});
	
	return options;
}

// determine the parameters of the form group from the available options, called recursively
function constructRpForm(displayRoot,opt){
	
	/* opt structure is passed down from compileSelectableOptions() 
	and subsequent parent SEGs, of the form: {
		SE: [{path:'',entry{}}], list of selection entries to display
		SEG: [{}], list of child SEGs to recursively display
		[path]: string, path to the current scope from parent (only if currently an SEG child)
		[parentSEG]: {}, catalogue link to the current SEG containing the SE options
		[parentOpt]: {}, link to the parent opt structure
		[hidden]: bool, if the parent SEG is hidden
		[parentMin]: num, inhereted min constraint (from SEG)
		[parentMax]: num, inhereted max constraint
		[radioGroup]: str, inhereted radio group name
		[newRadioGroup]: bool, indicates if this is the first SEs in a new radio group
		[rosterEntry]: {}, link to the current right panel parent roster entry
		[subHeaders]: [{}], array of sub-headers to add to form
	} */
	
	// prep the params
	let SEform = {
		title: '',
		children: []
	};
	// since we're mixing entryLinks and SE, sort everything alphabetically
	opt.SE.sort(sortByName);
	// if not defined, set default values for inhereted min/max
	opt.parentMin = exists(opt.parentMin)? opt.parentMin : 0;
	opt.parentMax = exists(opt.parentMax)? opt.parentMax : Infinity;
	opt.SEGselections = exists(opt.SEGselections)? opt.SEGselections : 0;
	
	
	// display the direct selection options
	opt.SE.forEach(SEwr => {
		// SEwr is SE wrapper, containing path string and SE entry
		
		// extract the actual SE from the wrapper
		let SE = SEwr.entry;
		// should it even be shown?
		const hide = getModifiedHidden(SE,opt.rosterEntry);
		
		// check for existing selections (entryId ends in SE id)
		let selections = 0;
		const rosChilds = opt.rosterEntry.selections ?? {};
		
		const selectionArr = Object.values(rosChilds).filter(
								sel => sel.entryId.split(':').pop() === SE.id);
		// include any selections pointing to same shared entry (since that's how the constr operate too)
		// const commonId = SE.targetId ?? SE.id;
		// const selectionArr = Object.values(rosChilds).filter(
								// sel => sel.link.targetId === commonId || sel.link.id === commonId);
		
		
		if(selectionArr.length > 0){
			// sum over potentially multiple non-merging entries
			selectionArr.forEach(sel => {
				selections += sel.quantity;
			});
			// get the per-unit quantity
			selections /= opt.rosterEntry.quantity;
		}
		
		
		// hide if entry or parent SEG is hidden, but override if already selected (allow to unselect)
		if((!hide && !opt.hidden) || selections>0){
			
			// first construct the path as array
			// note opt.path gets modified on each recursion to inject parent SEGs
			let pathArr = [opt.path ?? '', SEwr.path ?? '', SE.id];
			// for each SE option, determine display parameters
			let params = {
				// construct the id, containing path; use array to filter empty pieces
				id: pathArr.filter(p => p.length>0).join(':'),
				// get the label
				label: getModifiedName(SE,opt.rosterEntry),
			};
			
			
			// get the modified costs
			params.cost = {};
			const modCosts = getModifiedCost(SE,opt.rosterEntry);
			
			// only show non-zero values, (store under name not id), scale by entry quant (collective units)
			Object.values(modCosts).filter(c => c.value !== 0).forEach(cost => {
				params.cost[cost.name] = cost.value * opt.rosterEntry.quantity;
			});
			
			
			// set defaults
			let min = 0;
			let max = Infinity;
			
			// get modified constraints for this entry
			const modConstr = getModifiedConstraints(SE,opt.rosterEntry);
			min = modConstr.minQuant;
			max = modConstr.maxQuant;
			
			// compare to inhereted min/max
			const totalMin = Math.max(min,opt.parentMin);
			const totalMax = Math.min(max,opt.parentMax);
			
			
			// complete range of display values (only inhereted max is binding)
			const rangeMin = Math.min(min,selections);
			const rangeMax = Math.max(totalMax,selections);
			// no selection to make if min=max=selected
			// const noOption = rangeMin === rangeMax || rangeMax <= 0;
			const noOption = (min === totalMax && min === selections) || rangeMax <= 0;
			// unexpected case
			if(totalMax < min){
				console.log('Unexpected min '+min+' / max '+totalMax+' in '+params.label);
			}
			
			// determine input type
			if(rangeMax === 1){
				// must be check or radio
				// ignore a radio group if a hidden SEG or having illegal selections
				if(opt.radioGroup && !opt.hidden && !(opt.SEGselections > 1)){
					// radio button
					params.type = 'radio';
					params.radioGroup = opt.radioGroup;
					// if already selected
					params.checked = selections>0;
					
					// if a new radio group and selection not required, add the 'none' option
					// note can be part of a larger group min>1; still want none option
					if(opt.newRadioGroup && totalMin !== 1){
						
						// prepare a generic 'none' option
						let noneOption = {
							label:'None',
							id: opt.parentSEG.id+'_NONE', // SEG id is just to make unique
							cost:{},
							type: 'radio',
							radioGroup: opt.radioGroup,
							checked: opt.SEGselections===0	// select it if SEG has no selections
						};
						
						// sneak it in before the current item
						SEform.children.push(noneOption);
						
						// modify the opt group (only run once)
						opt.newRadioGroup = false;
						// if there's a parent, modify that opt group too
						if(opt.parentOpt)
							opt.parentOpt.newRadioGroup = false;
					}
					
				}else{
					// otherwise checkbox
					params.type = 'check';
					params.checked = selections>0;
				}
			}else{
				// otherwise must be number field
				params.type = 'number';
				params.min = rangeMin;
				// correct for other SEG selections
				let remainingMax = Math.min(max,opt.parentMax-opt.SEGselections+selections)
				// always show excess selections
				params.max = Math.max(selections,remainingMax); 
				params.value = selections;
				// non-merging entries can't decrease
				if(!SE.merge)
					params.min = selections;
			}
			
			// add it to the form (unless no option)
			if(!noOption)
				SEform.children.push(params);
		}
	});
	
	// if any, add to display
	if(SEform.children.length > 0){
		// first add any passed down sub-headers
		if(opt.subHeaders){
			// possibly multiple
			for(let k=0; k<opt.subHeaders.length; k++)
				addSubgroup(displayRoot,opt.subHeaders[k]);
			// clear the group
			opt.subHeaders = [];
			// clear from parent as well
			opt.parentOpt.subHeaders = [];
		}
		// now add the SEs
		addFormGroup(displayRoot,SEform);
	}
	
	// now process any SEGs
	opt.SEG.forEach(SEGobj => {
		
		// pass down a link to the parent opt group
		SEGobj.parentOpt = opt;
		
		// grab the catalogue entry
		const SEG = SEGobj.parentSEG;
		
		// check if it's hidden
		const hide = getModifiedHidden(SEG,opt.rosterEntry); 
		// push hiding down to SE logic; inherent if parent is hidden
		SEGobj.hidden = hide || opt.hidden;
		
		
		// give it a separator with title
		let headerParams = {
			// title: SEG.link?.name ?? SEG.name,	// use link if available
			title: getModifiedName(SEG,opt.rosterEntry),
		};
		// pass down the full path, trimming any empty strings
		let fullPath = [opt.path ?? '', SEGobj.path, SEG.id];
		SEGobj.path = fullPath.filter(s=>s.length>0).join(':');
		
		// determine how many selections have been made of this SEG
		const queryParams = {
			scope: 'parent',
			rosterLink: opt.rosterEntry, // the parent entry
			id: SEG.id,
			type: 'SEG',
			icf: false,
			ics: false
		};
		const SEGselections = query(queryParams);
		SEGobj.SEGselections = SEGselections;
		
		// set defaults
		let min = 0;
		let max = Infinity;
		
		
		const modConstr = getModifiedConstraints(SEG,opt.rosterEntry);
		min = modConstr.minQuant;
		max = modConstr.maxQuant;
		
		// compare current to previous inhereted min/max
		// we want the min max and max min
		SEGobj.parentMin = Math.max(min,opt.parentMin);
		SEGobj.parentMax = Math.min(max,opt.parentMax);
		
		// inheret or assign a radio group
		if(exists(opt.radioGroup)){
			// always inheret a radio group
			SEGobj.radioGroup = opt.radioGroup;
			// pass down newness (parent didn't display any SE)
			SEGobj.newRadioGroup = opt.newRadioGroup;
			
		}else if(SEGobj.parentMax === 1){
			// or create a new one
			SEGobj.radioGroup = headerParams.title;
			SEGobj.newRadioGroup = true; // needed for 'none' option
		}
		
		// pass down the roster link
		SEGobj.rosterEntry = opt.rosterEntry;
		
		// pass down the header params (to be displayed if any subsequent SE actual there)
		if(opt.subHeaders && opt.subHeaders.length > 0){
			// copy any remaining subheaders (parent didn't display any SE)
			SEGobj.subHeaders = opt.subHeaders.concat(headerParams);
			// only pass down to first child SEG; will be cleared by SE form
			// opt.subHeaders = [];
		}else{
			SEGobj.subHeaders = [headerParams];
		}
		
		// recursively call construct form
		constructRpForm(displayRoot,SEGobj);
		
	});
	
}

// flatten the opt structure from compileSelectableOptions to not require recursive processing
function flattenOpts(opt,path){
	
	// return object
	let flatOpt = [];
	
	path = path ?? [];
	
	// direct SE fairly straightforward
	opt.SE.forEach(SE => {
		// format the object
		let SEobj = {};
		// copy the path
		SEobj.path = [...path];
		// append to path if anything there
		if(SE.path.length > 0)
			SEobj.path.push(SE.path);
		// path is complete to the entry
		SEobj.path.push(SE.entry.id);
		
		SEobj.entry = SE.entry;
		// push to flat list
		flatOpt.push(SEobj);
	});
	
	// recurse through SEGs
	opt.SEG.forEach(SEG => {
		// pass down a temp path to each SEG
		let tempPath = [...path];
		// append this SEG path
		if(SEG.path.length > 0)
			tempPath.push(SEG.path);
		if(SEG.parentSEG)
			tempPath.push(SEG.parentSEG.id);
		
		// run recursively and concat results
		flatOpt = flatOpt.concat(flattenOpts(SEG,tempPath));
		
	});
	
	// return the flat object
	return flatOpt;
	
}

// compile Force and Roster scoped modifiers
function compileForceModifiers(fid){
	
	// get force
	let force = roster.forces[fid];
	
	// register this force (won't follow category links), both preview and full
	getModifiers(force.gstLink,force,true);
	getModifiers(force.gstLink,force,false);
	
	// run through all force-linked categories
	force.gstLink.categoryLinks.forEach(thisCtg => {
		// process through same routine as the others
		getModifiers(thisCtg,force,true);
		getModifiers(thisCtg,force,false);
	});
	
	// run through full catalogue category list
	Object.values(force.catalogue.categoryEntries).forEach(thisCtg => {
		// needs fixed eventually -- roster-scoped increment mods will be repeated per force
		getModifiers(thisCtg,force,true);
		getModifiers(thisCtg,force,false);
	});
	
	// run through root entries (preview only)
	for(const key in force.catalogue.root){
		getModifiers(force.catalogue.root[key],force,true);
		
		// also check linked entries
		if(force.catalogue.root[key].link || 0)
			getModifiers(force.catalogue.root[key].link,force,true);
	}
	
	
}

// compile preview modifiers for children, and remaining mods for selection
var lastOpt;
function getNewSelectModifiers(rosEntry){
	// make entry for conditions and mods
	if(!rosEntry.conditions)
		rosEntry.conditions = {};
	if(!rosEntry.modifiers)
		rosEntry.modifiers = {};
	
	// first evaluate preview mods
	// get immediate selection options (filterHidden false)
	let opt = compileSelectableOptions(rosEntry.link,rosEntry,false);
	lastOpt = opt;
	// SE:[], SEG:[], parentSEG?:{}
	
	// recursive function to run through all collected
	function getChildPreviewMods(optGroup){
		
		// run through SEs, storing to current roster entry
		optGroup.SE.forEach(SE => {
			
			// get SE as found (might be a link)
			getModifiers(SE.entry,rosEntry,true);
			// check if a link
			if(SE.entry.link || 0)
				getModifiers(SE.entry.link,rosEntry,true);
			// check the path entry if any; exclude roster parent
			if(SE.pathEntry && SE.path !== rosEntry.link.targetId)
				getModifiers(SE.pathEntry,rosEntry,true);
		});
		
		// check the parent SEG if any
		if(optGroup.parentSEG)
			getModifiers(optGroup.parentSEG,rosEntry,true);
		
		// check the path entry to here, if any; exclude roster parent
		if(optGroup.pathEntry && !pathChecked[optGroup.path] && optGroup.path !== rosEntry.link.targetId){
			
			getModifiers(optGroup.pathEntry,rosEntry,true);
			pathChecked[optGroup.path] = true;
		}
		
		// run through SEGs
		optGroup.SEG.forEach(SEG => {
			
			// and recurse through any further SEGs
			getChildPreviewMods(SEG);
		});
		
	}
	
	// track what pathEntries have been checked, to avoid repeat
	let pathChecked = {};
	
	// execute
	getChildPreviewMods(opt);
	
	// then fill in any remaining (non-preview) mods to this entry itself (and linked)
	getModifiers(rosEntry.link,rosEntry,false);
	if(rosEntry.link.targetId && rosEntry.link.link)
		getModifiers(rosEntry.link.link,rosEntry,false);
	
	//debug; non-linked entries getting pushed in here
	if(rosEntry.link.targetId && !rosEntry.link.link){
		console.log('getChildPreviewMods: entry has targetId but not link, ',rosEntry);
	}
	
	// also fill in SEGs along entryId path
	getPathEntries(rosEntry).forEach(pathEntry => {
		getModifiers(pathEntry,rosEntry,false);
	});
	
}

// check an entry for force and roster-scoped modifiers and conditions or groups
function getModifiers(entry,storeTo,preview){
	/* 
	entry is catalogue entry
	storeTo is the roster entry to store the modifiers to (but not necessarily conditions)
	preview (boolean), whether to only fetch display modifiers (e.g. hidden)
	 */
	 
	
	// if a force, treat as root options
	const force = parentForce(storeTo);
	const isForce = storeTo.id === force.id;
	
	// store under its own id (links need to be individually modifiable without impacting shared entry)
	// exception is category links
	let targetId = entry.id;
	
	// get the modifiers, if any
	let modArr = entry.modifiers ?? [];
	
	
	modArr.forEach(mod => {
		
		try{
		
		// parse and store a few points
		let modObj = {
			status: true, // default true in case no conditions
			repeat: 1,	// how many times to apply mod, default 1 in case no conditions
			link: mod,
			entryLink: entry,
			conditions: [], // links to the stored conditions
			// entryType - ctg,SE,SEG,force
			// field - what's actually being modified
			// fieldType - convenience, what is the field
		};
		
		// guess the modified object type
		if(exists(entry.import)){
			// deref if a link; SEGs don't have a 'type'
			modObj.entryType = (entry.link ?? entry).type||0 ? 'SE' : 'SEG';
			
		}else if(exists(entry.categoryLinks)){
			// forces assumed to always have categoryLinks
			modObj.entryType = 'force';
			
		}else{
			// categories and forces have no 'import' attr
			modObj.entryType = 'category';
			// category links should store to the target ID
			targetId = entry.targetId ?? entry.id;
		}
		
		// figure out what it's modifying
		// basic fields
		if(mod.field === 'name'){
			modObj.field = 'name';
			modObj.fieldType = 'display';
		}else if(mod.field === 'hidden'){
			modObj.field = 'hidden';
			modObj.fieldType = 'display';
		}else if(mod.field === 'category'){
			modObj.field = 'category';
			modObj.fieldType = 'display';
		}
		// try cost types
		Object.keys(force.catalogue.costTypes).forEach(cost => {
			if(mod.field === cost){
				modObj.field = cost;
				modObj.fieldType = 'cost';
			}
		});
		// try sibling constraints, including linked
		const allConstr = (entry.constraints ?? []).concat(entry.link?.constraints ?? []);
		const matchConstr = allConstr.filter(c => c.id === mod.field);
		if(matchConstr.length === 1){
			// store some info
			modObj.field = matchConstr[0].id;
			if(matchConstr[0].type === 'min'){
				modObj.fieldType = 'min-constraint';
			}else if(matchConstr[0].type === 'max'){
				modObj.fieldType = 'max-constraint';
			}else{
				console.log('Unexpected constraint type');
			}
			
		}else if(matchConstr.length > 1){
			console.log('Modifier to '+entry.name+' matched multiple constraints');
		}
		
		// check if this modifier is relevant to 'preview' type compilation
		// const isPreviewType = modObj.fieldType === 'display' || modObj.fieldType === 'cost'
					// || modObj.fieldType === 'max-constraint';
		// save modifiers as soon as conditions are in scope; everything is 'preview'
		const isPreviewType = true;
		
		
		// next, check if the conditions and repeats are in scope (for preview)
		let allCondInScope = true;
		let condObjArr = [];
		(mod.conditions ?? []).concat(mod.repeats ?? []).forEach(cond => {
			// process it, returning the wrapper object; pass in preview as impacts storescope
			let newCond = processCondition(cond,entry,storeTo);
			condObjArr.push(newCond);
			// see if all conditions still in scope
			allCondInScope &= newCond.inScope;
		});
		
		// also handle any groups
		let groupArr = [];
		(mod.conditionGroups ?? []).forEach(group => {
			// process it, returning the wrapper object
			let newGroup = processGroup(group,entry,storeTo);
			groupArr.push(newGroup);
			// see if all conditions still in scope
			allCondInScope &= newGroup.inScope;
			
			//debug, complain if empty group
			if(newGroup.conditions.length == 0 && newGroup.groups.length == 0){
				console.log('Found empty group in '+entry.name+', '+entry.id, newGroup);
			}
			
		});
		// all of this was to establish if the modifier is actionable
		
		// see if it meets all the preview criteria
		const validPreviewMod = preview && isPreviewType && allCondInScope;
		// exclusively not a preview (prevent repeat storing mods on second pass)
		const exlNotPreview = !preview && (!isPreviewType || !allCondInScope);
		
		// see if we still didn't find anything
		if(!exists(modObj.field)){
			console.log('failed to find modifier target '+mod.field);
			
		// check expected conditions, without repeating
		}else if(validPreviewMod || exlNotPreview){
			
			// process condition groups
			groupArr.forEach(wrapper => {
				addCondition(modObj,wrapper,storeTo);
			});
			
			// store conditions into roster and link back to modObj
			condObjArr.forEach(wrapper => {
				addCondition(modObj,wrapper,storeTo);
			});
			
			// finally store the mod
			// make an array if not yet
			if(!exists(storeTo.modifiers[targetId]))
				storeTo.modifiers[targetId] = [];
				
			let modInd = storeTo.modifiers[targetId].push(modObj);
			const modLink = storeTo.modifiers[targetId][modInd-1];
			
			// backlink also from conditions to now stored mod
			modObj.conditions.forEach(cond => {
				// cond.parent = storeTo.modifiers[targetId][modInd-1];
				cond.parent = modLink;
			});
			
			// if the mod has any repeat conditions, update the repeat total now
			if(modObj.conditions.some(c => c.isRepeat))
				propagateConditionStatus(modObj.conditions[0]); // any condition can trigger
			
			
			// further steps needed for constraint modifiers
			if(modObj.fieldType === 'min-constraint' || modObj.fieldType === 'max-constraint'){
				
				// fetch a link to the stored constraint
				// the id it will be stored under (can't use link as categories not linked)
				const constrTargId = entry.targetId ?? entry.id;
				// all expected scopes 
				let allScopes = [roster,storeTo];
				// if(!(isForce))
					// allScopes = allScopes.concat(storeTo);
				// add all ancestors
				let storeScope = storeTo;
				while(storeScope.parent || 0){
					allScopes.push(storeScope.parent);
					storeScope = storeScope.parent;
				}
				
				// attempt to filter down to the targeted constr
				let targConstr = [];
				allScopes.forEach(thisScope => {
					const entryConstr = thisScope.constraints?.[constrTargId] ?? [];
					targConstr = targConstr.concat( entryConstr.filter(c => c.link.id === modObj.field) );
				});
				
				// did we find it?
				if(targConstr.length === 0){
					console.log('Didnt find constraint for mod',modObj);
					// console.log(modObj);
				}else if(targConstr.length > 1){
					console.log('mod matched multiple constraints',modObj);
				}else{
					// link constraint and mod
					const constrLink = targConstr[0];
					// make a holder if needed
					if(!constrLink.modifiers)
						constrLink.modifiers = [];
					// link mod from constr
					constrLink.modifiers.push(modLink);
					// link constr from mod
					modLink.constraint = constrLink;
					
				}
				
				
			}
			
			
		}else if(!preview && isPreviewType && allCondInScope){
			// these should already have been stored
			
		}else if(preview && (!isPreviewType || !allCondInScope)){
			// these will get caught on second pass
			
		}else{
			console.log('Unexpected state in '+entry.id);
		}
		
		
		}catch(err){console.log(err);}
		
	});
	
}

// define how to process conditions
function processCondition(cond,entry,rosterDest){
	// rosterDest - destination passed in to have it's id for self scope
	
	// get a force reference
	const force = parentForce(rosterDest);
	
	// add some basic info
	let condObj = {
		status: false,  // boolean for conditions, int for repeats
		link: cond,		// the condition catalogue entry
		entry: entry,	// this is the parent catalogue entry
		isGroup: false,
		isRepeat: !!cond.repeats,	// force to bool if anything there
		count: 0,	// the live count (to compare against linked threshold)
		// parent - ultimately, a link to the source mod or group to push updates to
	};
	
	// a further wrapper
	let condWrapper = {
		obj: condObj,
		inScope: false,	// refers to scope available to preview, before it's been selected
		targetId: cond.childId,  // the filtering id to track for count (ever not childId?)
		// storeScope - pass back what scope to store to
	};
	
	// process according to its scope
	if(cond.scope === 'roster'){
		// make note of the scope
		condWrapper.storeScope = 'roster';
		condWrapper.inScope = true;
		
	}else if(cond.scope === 'force'){
		condWrapper.storeScope = 'force';
		condWrapper.inScope = true;
		
	}else if(cond.scope === force.catalogue.id || cond.scope === force.gstLink.id){
		// id references to force or catalogue entry treated as simple force scope
		condWrapper.storeScope = 'force';
		condWrapper.inScope = true;
			
	}else if(cond.scope === 'ancestor'){
		// note 'self' scope (rosDest) is actually parent of entry if a preview (also fine)
		condWrapper.storeScope = 'self';
		condWrapper.inScope = true;
		
	}else if(cond.scope === 'primary-catalogue'){
		// is in scope for preview
		condWrapper.storeScope = 'self'; // no need to store higher up (assumes instanceOf only)
		condWrapper.inScope = true;
		
	}else if(cond.scope === 'primary-category'){
		// is in scope for preview
		condWrapper.storeScope = 'self';
		condWrapper.inScope = true;
		
	}else if(cond.scope === 'parent'){
		// parent scope is in preview scope, since that's where viewing from
		condWrapper.inScope = true;
		
		// need to check rosterscope is already the parent (ie anything but the entry)
		if(rosterDest.link?.id === entry.id || rosterDest.link?.targetId === entry.id){
			condWrapper.storeScope = 'parent';
		}else{
			condWrapper.storeScope = 'self';
		}
		
	}else if(cond.scope === entry.id || cond.scope === entry.targetId || cond.scope === 'self'){
		// this is true 'self' scope; evaluate first, as may overlap with below
		condWrapper.storeScope = 'self';
		
	}else if(cond.scope === rosterDest.link?.id || cond.scope === rosterDest.link?.targetId){
		// this is a special case of 'parent' scope (ancestor of SEGs is in roster)
		condWrapper.inScope = true;
		condWrapper.storeScope = 'self';
		
	}else{
		// run through the ancestory
		let foundId = false;
		let searchNode = rosterDest;
		while(searchNode.parent || 0){
			searchNode = searchNode.parent;
			// see if this ancestor is the named scope
			if(cond.scope === searchNode.link?.id || cond.scope === searchNode.link?.targetId){
				foundId = true;
				// record a tag, and path to roster entry
				condWrapper.storeScope = 'ancestral:'+getFullId(searchNode).join(':');
				// ancesteral is also in preview scope, since the roster entry exists to hold it
				condWrapper.inScope = true;
			}
		}
		
		// debug
		if(!foundId)
			console.log('did not match condition scope '+cond.scope+', from entry '+entry.id);
		// console.log(rosterDest);
	}
	
	// return the modified wrapper
	return condWrapper;
}

// define how to process condition groups, recursively
function processGroup(group,entry,rosterDest){
	
	// add some basic info
	let groupObj = {
		status: true,
		link: group,
		isGroup: true,
		isRepeat: false,
		type: group.type,
		conditions: [], 	// links to stored child conditions (and groups)
	};
	
	// a further wrapper
	let groupWrapper = {
		obj: groupObj,
		inScope: group.type === 'and', // set starting scope according to the group type
		storeScope: 'self',	// always dump groups to self, wherever that currently is?
		targetId: 'group',  // always store under id 'group'
		conditions: [],		// array of child condition wrappers
		groups: [],		// array of child group wrappers
	};
	
	
	// handle nested conditionGroups recursively
	(group.conditionGroups ?? []).forEach(childGroup => {
		// process subgroup, returning the wrapper object
		let newGroup = processGroup(childGroup,entry,rosterDest);
		
		// store regardless; scope handled at higher level
		groupWrapper.groups.push(newGroup);
		
		// see if all conditions still in scope, respecting group type
		if(groupObj.type === 'or'){
			groupWrapper.inScope |= newGroup.inScope;
		}else{
			groupWrapper.inScope &= newGroup.inScope;
		}
		
	});
	
	// debug, track if conditions are in or out of scope
	let anyInScope = false;
	let anyOutScope = false;
	
	// also process normal conditions in group
	(group.conditions ?? []).concat(group.repeats ?? []).forEach(cond => {
		// process it, returning the wrapper object
		let newCond = processCondition(cond,entry,rosterDest);
		
		// store regardless; scope handled at higher level
		groupWrapper.conditions.push(newCond);
		
		// see if all conditions still in scope, respecting group type
		if(groupObj.type === 'or'){
			groupWrapper.inScope |= newCond.inScope;
		}else if(groupObj.type === 'and'){
			groupWrapper.inScope &= newCond.inScope;
		}else{
			console.log('unexpected group type '+groupObj.type);
		}
		
		// debug, track scopes
		anyInScope |= newCond.inScope;
		anyOutScope |= !newCond.inScope;
		
	});
	
	// debug, check for mixed scope in group
	if(groupObj.type === 'or' && anyInScope && anyOutScope){
		console.log('Mixed scope group in '+entry.name+', '+entry.id);
	}
	
	
	return groupWrapper;
}

// store a condition or conditionGroup to the roster scope, and link back to the parent (mod or group)
function addCondition(parent,wrapper,rosterScope){
	// parent is the modObj or groupObj to link back to
	// wrapper is a cond or group wrapper
	//	  wrapper.obj holds condObj
	//    condObj.link holds catalogue condition
	// rosterScope is where to save general modifiers
	
	// get the force from any roster entry
	// const fid = getFullId(rosterScope).shift();
	const force = parentForce(rosterScope);
	const fid = force.id;
	// convenience
	const isGroup = wrapper.obj.isGroup;
	
	// handle groups, depth first
	if(isGroup){
		
		// store any child groups
		wrapper.groups.forEach(childGroup => {
			// pass the current group obj as parent
			addCondition(wrapper.obj,childGroup,rosterScope);
			
			// assume the AND case for now
			wrapper.obj.status &= childGroup.obj.status;
		});
		
		// then store any conditions
		wrapper.conditions.forEach(childCond => {
			// pass the current group obj as parent
			addCondition(wrapper.obj,childCond,rosterScope);
			
			wrapper.obj.status &= childCond.obj.status;
		});
		
		// if OR, check for any single positive (note dropping wrappers, groups now also in cond list)
		if(wrapper.obj.type === 'or'){
			// start false unless it has no conditions
			wrapper.obj.status = wrapper.obj.conditions.length === 0;
			wrapper.obj.status |= wrapper.obj.conditions.some(c => c.status);
		}
		
		
	}else{
		// process regular conditions
		
		// get link to catalogue condition
		const catCond = wrapper.obj.link;
		
		// convert values from strings if needed
		if(typeof catCond.value === 'string'){
			catCond.value = parseInt(catCond.value);
			catCond.includeChildForces = catCond.includeChildForces === 'true';
			catCond.includeChildSelections = catCond.includeChildSelections === 'true';
		}
		// special case also for repeats
		if(catCond.repeats && typeof catCond.repeats === 'string'){
			catCond.repeats = parseInt(catCond.repeats);
			catCond.roundUp = catCond.roundUp === 'true';
		}
		
				
		// evaluate certain conditions immediately
		if(catCond.scope === 'primary-catalogue'){
			// respect instanceOf / notInstanceOf
			if(catCond.type === 'instanceOf'){
				wrapper.obj.status = force.catalogue.id === wrapper.targetId;
			}else if(catCond.type === 'notInstanceOf'){
				wrapper.obj.status = force.catalogue.id !== wrapper.targetId;
			}else{
				// be safe
				console.log('Unexpected condition type of '+catCond.type+' with primary-catalogue scope'
						+' in ',rosterScope);
			}
			
		}else if(catCond.scope === 'primary-category'){
			// find the primary category
			let primeCtg = '';
			// run through ancestry, starting with self, and ending on force
			let searchNode = rosterScope;
			while(searchNode.parent){
				if(searchNode.link.primeCtg){
					primeCtg = searchNode.link.primeCtg;
				}
				searchNode = searchNode.parent;
			}
			//debug
			if(primeCtg.length === 0){
				console.log('Unable to find prime category from ',wrapper.obj);
				// console.log('primary-category condition in ',parent);
			}
			
			// respect instanceOf / notInstanceOf
			if(catCond.type === 'instanceOf'){
				wrapper.obj.status = primeCtg === wrapper.targetId;
			}else if(catCond.type === 'notInstanceOf'){
				wrapper.obj.status = primeCtg !== wrapper.targetId;
			}else{
				// be safe
				console.log('Unexpected condition type of '+catCond.type+' with primary-category scope'
						+' in ',rosterScope);
			}
			
		}else if(catCond.scope === 'ancestor'){
			
			let searchNode = rosterScope;
			const searchId = catCond.childId;
			// check self (note rosterscope might be self or parent, depending on preview)
			let foundId = false;
			// run through the ancestry; will not run on force
			while(searchNode.parent || 0){
				
				// see if this ancestor is the named id
				if(searchId === searchNode.link.id || searchId === searchNode.link.targetId){
					foundId = true;
					
				}else{
					// otherwise, also search this and linked entry's categories
					const allCtg = (searchNode.link.categoryLinks ?? [])
								.concat(searchNode.link.link?.categoryLinks ?? []);
					// check all the ctg ids
					if(allCtg.some(c => c.targetId === searchId)){
						foundId = true;
					}
				}
				
				// move up ancestry
				searchNode = searchNode.parent;
			}
			
			// respect instanceOf / notInstanceOf
			if(catCond.type === 'instanceOf'){
				wrapper.obj.status = foundId;
			}else if(catCond.type === 'notInstanceOf'){
				wrapper.obj.status = !foundId;
			}else{
				// be safe
				console.log('Unexpected condition type of '+catCond.type+' with ancestor scope'
						+' in '+rosterScope.entryId);
			}
			
		}else{
		// all other cases, do a numeric query to catch up count
			
			// ancestral type requires re-scope
			let queryScope = rosterScope;
			if(/ancestral:/.test(wrapper.storeScope))
				queryScope = rosterFromPath(wrapper.storeScope.split('ancestral:').join(''));
			
			// parameter object for query
			const queryParams = {
				scope: catCond.scope,
				rosterLink: queryScope, // gets ignored for 'roster' scope
				id: catCond.childId,
				icf: catCond.includeChildForces,
				ics: catCond.includeChildSelections
			};
			// add note for 'forces' type query
			if(catCond.field === 'forces')
				queryParams.type = 'force';
			
			// execute the query
			wrapper.obj.count = query(queryParams);
			
			// evaluate current status, based on live count
			wrapper.obj.status = checkCondition(wrapper.obj);
			
		}
	}
	
	// update the mod (or parent group) status
	parent.status &= wrapper.obj.status;
	
	// store this condition into the roster scope
	
	// get a reference to the storage scope
	let condStoreTo;
	if(wrapper.storeScope === 'roster'){
		condStoreTo = roster;
		
	}else if(wrapper.storeScope === 'force'){
		condStoreTo = force;
		
	}else if(wrapper.storeScope === 'parent'){
		condStoreTo = rosterScope.parent;
		
	}else if(wrapper.storeScope === 'self'){
		condStoreTo = rosterScope;
		
	}else if(/ancestral:/.test(wrapper.storeScope)){
		condStoreTo = rosterFromPath(wrapper.storeScope.split('ancestral:').join(''));
		
	}else{
		//debug
		console.log('Unexpected storage scope for condition ',wrapper);
	}
	// debug
	if(!exists(condStoreTo)){
		console.log('Undefined condition storage dest from '+rosterScope.name+', '+rosterScope.link?.id);
		console.log(wrapper);
	}
	
	// prep the condition holder, if needed
	if(!exists(condStoreTo.conditions)){
		condStoreTo.conditions = {};
	}
	condStoreTo = condStoreTo.conditions;
		
	
	// make an array if needed
	if(!exists(condStoreTo[wrapper.targetId]))
		condStoreTo[wrapper.targetId] = [];
	
	const condInRoster = condStoreTo[wrapper.targetId];
	
	// store the condition
	let ind = condInRoster.push(wrapper.obj);
	
	// add a link into parent to this condition
	parent.conditions.push(condInRoster[ind-1]);
	
	// groups add backlinks to their now stored location into their children
	if(isGroup){
		// backlink also from child conditions to now stored group
		// note both groups and cond stored in conditions now
		wrapper.obj.conditions.forEach(childCond => {
			childCond.parent = condInRoster[ind-1];
		});
	}
	
}

// check the status of a condition's live count against the threshold value
function checkCondition(condObj){
	
	// grab the params
	const cType = condObj.link.type;	// condition type
	const thr = condObj.link.value;		// threshold value (int)
	const count = condObj.count;		// live count (int)
	
	// work through the different condition types
	if(condObj.isRepeat){
		// console.log('found repeat under '+condObj.entry.name,condObj.entry);
		// handle repeats differently; returns no. times to repeat
		return Math.floor(count / thr)*condObj.link.repeats;
		
	}else if(cType === 'instanceOf'){
		// if any found in query
		return count >= 1;
		
	}else if(cType === 'notInstanceOf'){
		// if none found in query
		return count === 0;
		
	}else if(cType === 'lessThan'){
		return count < thr;
		
	}else if(cType === 'atMost'){
		return count <= thr;
		
	}else if(cType === 'greaterThan'){
		return count > thr;
		
	}else if(cType === 'atLeast'){
		return count >= thr;
		
	}else if(cType === 'equalTo'){
		return count === thr;
		
	}else if(cType === 'notEqualTo'){
		return count !== thr;
		
	}else{
		console.log('Unexpected condition type: '+cType);
	}
	
}

// push any changes to a condition's status to it's target modifier or condition group
var lastCond;
function propagateConditionStatus(cond){
	
	lastCond = cond;
	
	// revaluate the parent status
	let pCond = cond.parent;
	const oldStatus = pCond.status;
	let newStatus = false;
	
	// take sum of all repeats
	let repeatTotal = 0;
	pCond.conditions.filter(c => c.isRepeat).forEach(repeat => {
		repeatTotal += repeat.status;
	});
	
	// normal conditions, filter out the repeats
	const nonRepeats = pCond.conditions.filter(c => !c.isRepeat);
	
	// different process for 'or' groups
	if(pCond.isGroup && pCond.type === 'or'){
		// search for any positive
		newStatus = nonRepeats.some(c => c.status);
		
	}else{
		// non-groups and 'and' groups, search for any negative
		// should be true for empty set (repeats only)
		newStatus = !nonRepeats.some(c => !c.status);
	}
	
	// apply the new status and record repeats 
	// if both repeats and conditions, conditions must pass for repeat to apply
	pCond.status = !!newStatus;	// force to bool
	pCond.repeat = (newStatus?1:0) * repeatTotal; // force to int
	
	// if a group, propagate further up the chain
	if(pCond.isGroup && oldStatus != pCond.status){
		propagateConditionStatus(pCond);
	}
	
}

// update the cost subtotals through the entire roster
function updateRosterCosts(){
	
	// depth-first recursion to lowest children
	function costOfSelfAndChildren(rosEntry){
		
		let totalCost = {};
		const isRoster = rosEntry.forces && !rosEntry.catalogue;
		const isForce = rosEntry.catalogue;
		
		// get own cost, if not the roster or a force
		if(!isRoster && !isForce){
			totalCost = getModifiedCost(rosEntry.link,rosEntry);
			// multiply by roster quantity
			Object.keys(totalCost).forEach(costType => {
				totalCost[costType].value *= rosEntry.quantity ?? 1;
			});
		}
		
		// run on any child forces
		Object.values(rosEntry.forces ?? {}).forEach(childForce => {
			costOfSelfAndChildren(childForce);
			// addchild costs to total
			subtotalCosts(totalCost,childForce.costs);
		});
		
		// run on child selections
		Object.values(rosEntry.selections ?? {}).forEach(child => {
			costOfSelfAndChildren(child);
			// addchild costs to total
			subtotalCosts(totalCost,child.costs);
		});
		
		// store the cost totals
		rosEntry.costs = totalCost;
		
	}
	
	// run from the top
	costOfSelfAndChildren(roster);
	
}

// convenience, add cost objects; directly modifies input
function subtotalCosts(runningTotal,newCosts){
	// iterate over any new costs
	Object.keys(newCosts).forEach(costType => {
		// make an entry in the total if not yet
		if(!runningTotal[costType]){
			runningTotal[costType] = {
				value: 0,
				name: newCosts[costType].name,
			}
		}
		// increase total
		runningTotal[costType].value += newCosts[costType].value;
	});
}

var nodeCount = 0;
var lastConvert;
var lastNode;
// convert XML to JSON
function convertToJson(xml,name){
	
	lastConvert = xml;
	
	// track file info through conversion
	let newObj = {
		name: name,
		json: {}
	};
	
	// need to start inside the xml wrapper
	let docRoot = xml.children[0];
	// recursively convert
	newObj.json = convertChildren(docRoot);
	conversions.push(newObj);
	
	// mark status to complete
	console.log('Finished converting');
}

// recursively convert XML child nodes
function convertChildren(xmlnode){
	let jsonNode = {};
	lastNode = xmlnode;
	nodeCount++;
	
	
	// add current node attributes
	for(let i=0; i<xmlnode.attributes.length; i++){
		jsonNode[xmlnode.attributes[i].name] = xmlnode.attributes[i].value;
	}
	// some nodes contain direct text (e.g. characteristic)
	if(xmlnode.hasChildNodes() && xmlnode.childNodes[0].nodeType === Node.TEXT_NODE){
		// check that it's non-trivial
		let nodeText = xmlnode.childNodes[0].nodeValue.trim();
		if(nodeText.length > 0){
			jsonNode.text = nodeText;
			if(xmlnode.tagName !== 'characteristic'){
				console.log('new Direct text: '+xmlnode.tagName);
				console.log(xmlnode);
			}
		}
	}
	
	for(let k=0; k<xmlnode.children.length; k++){
		// check if array group
		let tag = xmlnode.children[k].tagName;
		if(arrayTagList.includes(tag)){
			// all children of an array group guaranteed to be of same type, and have no attributes
			// make arr and iterate through next children
			jsonNode[tag] = [];
			for(let m=0; m<xmlnode.children[k].children.length; m++){
				jsonNode[tag].push(convertChildren(xmlnode.children[k].children[m]));
			}
		}else{
			// orphan values (textContent) just add as attribute
			jsonNode[tag] = xmlnode.children[k].textContent.trim();
			if(!orphanTagList.includes(tag)){
				console.log('new orphan type: '+tag);
			}
		}
	}
	return jsonNode;
}



// -----------  UTILITIES  -------------------
// get JSON data, return promise
function getJsonData(URI){
	return fetch(encodeURI(URI))
		.then(response => response.text())
        .then(str => JSON.parse(str))
		.catch(console.log);
}
// get string data
function getStringData(URI){
	return fetch(encodeURI(URI))
		.then(response => response.text())
		.catch(console.log);
}
// get XML and convert to JSON
function getXmlData(URI){
	return fetch(encodeURI(URI))
		.then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
		.then(xml => convertChildren(xml.children[0]))
		.catch(console.log);
}
// convert string to XML to JSON
function xmlStrToJson(str){
	let xml = new window.DOMParser().parseFromString(str, "text/xml");
	return convertChildren(xml.children[0]);
}
// read a file and return promise
function file2text(file){
  return new Promise((resolve, reject) => {
    let fr = new FileReader();  
    fr.onload = () => {
      resolve(fr.result )
    };
    fr.onerror = reject;
    fr.readAsText(file);
  });
}

// generate random ids
function makeid(length) {
    let result           = '';
    let characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// convenience functions
function show(id){
	document.getElementById(id).classList.remove('d-none');
}
function hide(id){
	document.getElementById(id).classList.add('d-none');
}
function exists(testVar){
	return (typeof testVar !== 'undefined');  // note nulls will pass
}
// simple string sorting function
function strSort(a,b){
	// ignore case
	a = a.toUpperCase();
	b = b.toUpperCase();
	
	if (a < b) {
		return -1;
	}
	if (a > b) {
		return 1;
	}
	// must be equal
	return 0;
}
// sorting function aware of entryLinks
function sortByName(a,b){
	// check if buried inside wrapper
	const unwrA = a.entry ?? a;
	const unwrB = b.entry ?? b;
	// check for linked entries
	const nameA = unwrA.link?.name ?? unwrA.name;
	const nameB = unwrB.link?.name ?? unwrB.name;
	// use simple string sort
	return strSort(nameA,nameB);
}

// force the included code to wait for the next page repaint, to break up long processes
function waitForRepaint(callback){
	requestAnimationFrame(() => {	// before the next repaint
		requestAnimationFrame(() => {	// before the subsequent repaint
			callBack();
		});
	});
}
// another option, to simply put a breakpoint in a body of code (requires await)
function yieldToMain() {
	return new Promise(resolve => {
		setTimeout(resolve, 0);
	});
}
// for testing
function sleepStupidly(msec) {
	var endtime = new Date().getTime() + msec;
	while (new Date().getTime() < endtime);
}


// Given a roster entry, generate a full uid path (of internal/unique ids)
function getFullId(rosterEntry){
	let path = [rosterEntry.id];
	// move up tree
	while(rosterEntry.parent || 0){
		rosterEntry = rosterEntry.parent;
		path.push(rosterEntry.id);
	}
	// reverse for top-down path
	return path.reverse();
}

// Given an uid path, get the roster entry
function rosterFromPath(path){
	// convert a string
	if(exists(path.length) && typeof path !== 'object'){
		path = path.split(':');
	}
	
	// dig into roster
	let rosterEntry = roster;
	for(let k=0;k<path.length;k++){
		// check forces and selections, else error
		if(rosterEntry.forces && rosterEntry.forces[path[k]]){
			rosterEntry = rosterEntry.forces[path[k]];
		}else if(rosterEntry.selections && rosterEntry.selections[path[k]]){
			rosterEntry = rosterEntry.selections[path[k]];
		}else{
			// console.log('Unknown id '+path[k]+' in path: '+path.join(':'));
			return false;
		}
	}
	return rosterEntry;
}

// get the full catalogue path of an entry
function getFullPath(rosEntry){
	
	let path = [];
	let node = rosEntry;
	
	// move up the ancestry
	while(node.parent && !node.catalogue){
		
		// insert the current entryId path to the front of the path
		node.entryId.split(':').reverse().forEach(e => path.unshift(e));
		
		node = node.parent;
	}
	
	return path;
	
}

// Given an entryId path from a starting entry, get the catalogue entry
function catalogueFromPath(startPoint,path){
	// startPoint is a catalogue entry, path is an entryId string or array
	
	// convert a string
	if(exists(path.length) && typeof path !== 'object'){
		path = path.split(':');
		
		// zero length string, abort
		if(path[0].length === 0)
			return startPoint;
	}
	
	// dig into roster
	let node = startPoint;
	for(let k=0;k<path.length;k++){
		// first check itself
		if(node.id === path[k]){
			// do nothing
			
		// then check if it's a link
		}else if(node.link && node.link.id === path[k]){
			node = node.link;
			
		}else{
			// compile SE, SEG, and EL to check
			const SE = node.selectionEntries || [];
			const SEG = node.selectionEntryGroups || [];
			const EL = node.entryLinks || [];
			let match = SE.concat(SEG,EL).filter(e => e.id === path[k]);
			if(match.length > 0){
				node = match[0];
			}else{
				console.log('Didnt match entry '+path[k]+' from '+node.id+', '+node.name);
				console.log(path,startPoint);
				// abort rather than return some random node
				return;
			}
		}
	}
	return node;
}

// Get the containing parent of any roster entry
function parentForce(rosterEntry){
	// gets fid based on first entry of full ID
	return roster.forces[getFullId(rosterEntry).shift()];
}

// Get an array of the catalogue entries described by the entryId path
function getPathEntries(rosEntry){
	
	// prep the return array
	let entryArr = [];
	
	// if a force or roster, abort
	if(rosEntry.catalogue || rosEntry.forces)
		return entryArr;
	
	// break up the path
	let path = rosEntry.entryId.split(':');
	// discrard repeat of id
	path.pop();
	// will need to iteratively build up the path to get catalogue entries
	let pathStr = '';
	
	// if first item in path is parent link, skip it (add to path and remove from array)
	if(path[0] && path[0] === rosEntry.parent.link?.targetId){
		pathStr += path.shift();
	}
		
	// iterate over remaining path items
	path.forEach(pathId => {
		// append to path, avoiding leading ':'
		if(pathStr.length > 0)
			pathStr += ':';
		pathStr += pathId;
		
		// get this catalogue entry and push to array
		entryArr.push( catalogueFromPath(rosEntry.parent.link,pathStr) );
		
	});
	
	return entryArr;
}


