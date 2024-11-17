// -----------  GLOBALS  -------------------
var filesIn = [];
var fileStatus = {};
var conversions = [];

// define array and orphan types
var arrayType = {};
var orphanType = {};
const arrayTagList = ['publications', 'costTypes', 'profileTypes', 'characteristicTypes', 'categoryEntries', 'modifiers', 'conditions', 'repeats', 'constraints', 'conditionGroups', 'forceEntries', 'categoryLinks', 'rules', 'entryLinks', 'sharedSelectionEntries', 'profiles', 'characteristics', 'selectionEntries', 'costs', 'infoLinks', 'selectionEntryGroups', 'modifierGroups', 'sharedSelectionEntryGroups', 'sharedRules', 'sharedProfiles', 'catalogueLinks', 'forces', 'selections', 'categories', 'costLimits', 'sharedInfoGroups', 'infoGroups'];
const orphanTypeList = ['readme','description','comment'];

// add to obj for 'in' testing
arrayTagList.forEach(tag => {arrayType[tag]=true;});
orphanTypeList.forEach(tag => {orphanType[tag]=true;});

// external classes
var zip = new JSZip();


// Register load events
document.addEventListener('DOMContentLoaded', function() {
   immediateActions();
}, false);
window.onload = function(){
	windowLoadActions();
}

// Runs immediately on load
function immediateActions(){
	console.log('page load success');
	// activate file upload processor
	document.getElementById("fileUpload").addEventListener("change",fileEventHandler);
	document.getElementById("download").addEventListener("click",downloader);
}

// Runs slightly after DOM event
function windowLoadActions(){}


// -----------  UTILITIES  -------------------

// grab and parse XLM data files, return promise
function getXmlData(URI){
	return fetch(encodeURI(URI))
		.then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
		.then(xmlDoc => {return xmlDoc.children[0];})
		.catch(console.log);
}

// iterate and filter XML data
function getChildById(node,id){
	let childArr = node.children;
	for(let k=0; k<childArr.length; k++){
		if(childArr[k].attributes.id.value === id){
			return childArr[k];
		}
	}
	return {};
}
function getChildByTag(node,filterTag){
	let childArr = node.children;
	for(let k=0; k<childArr.length; k++){
		if(childArr[k].tagName === filterTag){
			return childArr[k];
		}
	}
	return {};
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


// convenience functions
function show(id){
	document.getElementById(id).classList.remove('d-none');
}
function hide(id){
	document.getElementById(id).classList.add('d-none');
}
function exists(testVar){
	return (typeof testVar !== 'undefined');
}


// -----------------  PAGE FUNCTIONALITY  ---------------------

// handle display of selected files
function fileEventHandler(){
	
	let fileList = this.files;
	// disable download button
	document.getElementById("download").disabled = true;
	
	// iterable, but not an array
	for(let k=0; k<fileList.length; k++){
		// prevent repeats
		if(!(fileList[k].name in fileStatus)){
			filesIn.push(fileList[k]);
			fileStatus[fileList[k].name] = 'Processing';
			
			// initiate conversion
			processFile(fileList[k]);
		}
	}
	// update page
	updateConversions();
}

// refresh the conversions list
function updateConversions(){
	let txtbox = document.getElementById("conversions");
	let innerTxt = '';
	let fnames = Object.keys(fileStatus);
	// track if any still being processed
	let anyProcessing = true;
	if(fnames.length > 0){
		anyProcessing = false;
		fnames.forEach(file => {
			innerTxt += '<div class="d-flex justify-content-between"><div>'+file+'</div><div class="ml-auto"'
					+' id="'+file+'"><i>'+fileStatus[file]+'</i></div>';
			innerTxt += '</div>';
			if(fileStatus[file] === 'Processing')
				anyProcessing = true;
		});
		txtbox.innerHTML = innerTxt;
	}

	// clear the upload box
	document.getElementById("fileUpload").value = '';
	
	// enable download button if none still underway
	if(!anyProcessing)
		document.getElementById("download").disabled = false;
}

// handle downloads
function downloader(){
	// check how many conversions
	if(conversions.length == 1){
		// save a single file directly as json
		let outfile = new File([JSON.stringify(conversions[0].json)], conversions[0].name+'.json',
					{type: "text/plain;charset=utf-8"});
		saveAs(outfile);
	}else{
		// if multiple, zip together
		let newzip = new JSZip();
		conversions.forEach(convert => {
			newzip.file(convert.name+'.json',JSON.stringify(convert.json));
		});
		// generate zip and prompt download
		newzip.generateAsync({type:"blob"})
			.then(function (blob) {
				saveAs(blob, "BS_data_conversion.zip");
			});
	}
}



// -----------------  BACKEND PROCESSING  ---------------------

// async process the received files
var zipData;
function processFile(inFile){
	// detect zipped files
	const zipRgx = /z$|zip$/i;
	
	if(zipRgx.test(inFile.name)){
		// console.log('found zip archive');
		// zip archive
		JSZip.loadAsync(inFile)
			.then(zipArch => {
				zipData = zipArch;
				// need filename to access and convert to string; forEach returns a null
				let fnames = Object.keys(zipArch.files);
				for(let k=0; k<fnames.length; k++){
					let fname = fnames[k];
					// console.log('processing '+fname);
					zipArch.file(fname).async('string')
						.then(str => new window.DOMParser().parseFromString(str, "text/xml"))
						.then(xml => convertToJson(xml,fname));
				}
			}).then(()=>{
				fileStatus[inFile.name] = 'Complete';
				updateConversions();
			}).catch(console.log);
		
	}else{
		// basic text file
		file2text(inFile)
			.then(str => new window.DOMParser().parseFromString(str, "text/xml"))
			.then(xml => convertToJson(xml,inFile.name))
			.then(()=>{
				fileStatus[fname] = 'Complete';
				updateConversions();
			}).catch(console.log);
	}
}


// var newPlurals = {};
var nodeCount = 0;
var lastConvert;
var lastNode;
// process the conversion
function convertToJson(xml,name){
	
	lastConvert = xml;
	// study tag types (debug)
	// findPluralTags(xml);
	
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

// recursively evaluate child tags
function findPluralTags(node){
	const pluralRgx = /s$/i; // ends with an s
	for(let k=0; k<node.children.length; k++){
		// check if new
		let tag = node.children[k].tagName;
		if(pluralRgx.test(tag) && !(tag in plurals) && !(tag in newPlurals)){
			newPlurals[tag] = true;
		}
		nodeCount++;
		
		// check children
		findPluralTags(node.children[k]);
	}
}

// should only operate on non-array nodes (containing array node children)
function convertChildren(xmlnode){
	let jsonNode = {};
	lastNode = xmlnode;
	nodeCount++;
	if(nodeCount%1000 == 0){ // every 1000 nodes
		// console.log(nodeCount+' nodes');
	}
	
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
		if(tag in arrayType){
			// all children of an array group guaranteed to be of same type, and have no attributes
			// make arr and iterate through next children
			jsonNode[tag] = [];
			for(let m=0; m<xmlnode.children[k].children.length; m++){
				jsonNode[tag].push(convertChildren(xmlnode.children[k].children[m]));
			}
		}else{
			// orphan values (textContent) just add as attribute
			jsonNode[tag] = xmlnode.children[k].textContent.trim();
			if(!(tag in orphanType)){
				console.log('new orphan type: '+tag);
			}
		}
	}
	return jsonNode;
}







