$(function(){

	var worldMap;
	var mouse = { x: 0, y: 0 }
	var countries = []
	var statesUS = []
	var shapesRendered = []
	var shapesRenderedUS = []
	var originalColors = []
	var originalColorsUS = []
	var currentYear = ''

	function Map() {

		this.WIDTH       = window.innerWidth;
		this.HEIGHT      = window.innerHeight;

		this.VIEW_ANGLE  = 45;
		this.NEAR        = 0.1;
		this.FAR         = 10000;
		this.CAMERA_X    = 0;
		this.CAMERA_Y    = 1000;
		this.CAMERA_Z    = 500;
		this.CAMERA_LX   = 0;
		this.CAMERA_LY   = 0;
		this.CAMERA_LZ   = 0;

		this.geo;
		this.scene = {};
		this.renderer = {};
		this.projector = {};
		this.camera = {};
		this.stage = {};

		this.INTERSECTED = null;
	}

	Map.prototype = {

		init_d3: function() {

			geoConfig = function() {

				this.mercator = d3.geo.equirectangular();
				this.path = d3.geo.path().projection(this.mercator);

				var translate = this.mercator.translate();
				translate[0] = 500;
				translate[1] = 0;

				this.mercator.translate(translate);
				this.mercator.scale(200);
			}

			this.geo = new geoConfig();
		},

		init_tree: function() {

			if( Detector.webgl ){
				this.renderer = new THREE.WebGLRenderer({
					antialias : true
				});
				this.renderer.setClearColorHex( 0xBBBBBB, 1 );
			} else {
				this.renderer = new THREE.CanvasRenderer();
			}

			this.renderer.setSize( this.WIDTH, this.HEIGHT );

			this.projector = new THREE.Projector();

			// append renderer to dom element
			$("#worldmap").append(this.renderer.domElement);

			// create a scene
			this.scene = new THREE.Scene();

			// put a camera in the scene
			this.camera = new THREE.PerspectiveCamera(this.VIEW_ANGLE, this.WIDTH / this.HEIGHT, this.NEAR, this.FAR);
			this.camera.position.x = this.CAMERA_X;
			this.camera.position.y = this.CAMERA_Y;
			this.camera.position.z = this.CAMERA_Z;
			this.camera.lookAt( { x: this.CAMERA_LX, y: 0, z: this.CAMERA_LZ} );
			this.scene.add(this.camera);
		},


		add_light: function(x, y, z, intensity, color) {
			var pointLight = new THREE.PointLight(color);
			pointLight.position.x = x;
			pointLight.position.y = y;
			pointLight.position.z = z;
			pointLight.intensity = intensity;
			this.scene.add(pointLight);
		},

		add_plane: function(x, y, z, color) {
			var planeGeo = new THREE.CubeGeometry(x, y, z);
			var planeMat = new THREE.MeshLambertMaterial({color: color});
			var plane = new THREE.Mesh(planeGeo, planeMat);

			// rotate it to correct position
			plane.rotation.x = -Math.PI/2;
			this.scene.add(plane);
		},

		add_countries: function(data, countrydata) {

				var countries = []
				var i, j;

				// convert to threejs meshes
				for (i = 0 ; i < data.features.length ; i++) {
					var geoFeature = data.features[i];
					var properties = geoFeature.properties;
					var feature = this.geo.path(geoFeature);

					// we only need to convert it to a three.js path
					var mesh = transformSVGPathExposed(feature);

					// add to array
					for (j = 0 ; j < mesh.length ; j++) {
						  countries.push({"data": properties, "mesh": mesh[j]});
					}
				}

				// extrude paths and add color
				for (i = 0 ; i < countries.length ; i++) {
					
					var colorToStore = this.getInternetColor(countries[i].data, countrydata)
					// create material color based on average
					var material = new THREE.MeshPhongMaterial({
						color: colorToStore,
						opacity:0.5
					});
					originalColors[i] = colorToStore
					// extrude mesh
					var shape3d = countries[i].mesh.extrude({
						amount: 1,
						bevelEnabled: false
					});

					// create a mesh based on material and extruded shape
					var toAdd = new THREE.Mesh(shape3d, material);

					//set name of mesh
					toAdd.name = countries[i].data.name;

					// rotate and position the elements
					toAdd.rotation.x = Math.PI/2;
					toAdd.translateX(-490);
					toAdd.translateZ(50);
					toAdd.translateY(20);

					// add to scene and shapes
					shapesRendered[i] = toAdd
					this.scene.add(toAdd);
				}
		},

		add_US_states: function(data, statedata){

				var countries = []
				var i, j;

				// convert to threejs meshes
				for (i = 0 ; i < data.features.length ; i++) {
					var geoFeature = data.features[i];
					var properties = geoFeature.properties;
					var feature = this.geo.path(geoFeature);

					// we only need to convert it to a three.js path
					var mesh = transformSVGPathExposed(feature);

					// add to array
					for (j = 0 ; j < mesh.length ; j++) {
						  countries.push({"data": properties, "mesh": mesh[j]});
					}
				}

				// extrude paths and add color
				for (i = 0 ; i < countries.length ; i++) {

					var colorToStore = this.getInternetColor(countries[i].data, statedata)
					// create material color based on average
					var material = new THREE.MeshPhongMaterial({
						color: colorToStore,
						opacity:0.5
					});
					originalColorsUS[i] = colorToStore

					// extrude mesh
					var shape3d = countries[i].mesh.extrude({
						amount: 1,
						bevelEnabled: false
					});

					// create a mesh based on material and extruded shape
					var toAdd = new THREE.Mesh(shape3d, material);

					//set name of mesh
					toAdd.name = countries[i].data.name;

					// rotate and position the elements
					toAdd.rotation.x = Math.PI/2;
					toAdd.translateX(-490);
					toAdd.translateZ(50);
					toAdd.translateY(20);

					// add to scene
					shapesRenderedUS[i] = toAdd
					this.scene.add(toAdd);
				}
		},

		// - assigns each country or state the appropriate 
		// - color based on our internet speed data set

		getArbitraryCountryColor: function(data) {
			var multiplier = 0;

			// - just gets the first 3 letters of the country's 
			// - name and makes an arbitrary # with them.
			for(i = 0; i < 3; i++) {
				multiplier += data.name.charCodeAt(i);
			}

			// - use our previously calculated arbitrary number
			// - to make a color
			multiplier = (1.0/366)*multiplier;
			return multiplier*0xffffff;
		},
		// - colors form light to dark based on internet speed:
		// - #ffbaba, #ff7b7b, #ff5252, #ff0000, #a70000
		getInternetColor: function(data, countryorstatedata) { //'data' here are the shapes/country infos
			// - internet speeds in kbps, constants calculated by sorting in excel.
			var lowestDL = 56.6552, highestDL = 100270.0
			var lowestUP = 14.0, highestUP = 92062.7
			var lowestDLRatio, highestDLRatio, lowestUPRatio, highestUPRatio

			if(!(typeof countryorstatedata[data.name] === 'undefined')){

				lowestDLRatio = countryorstatedata[data.name]['summary']['lowestDL'] / lowestDL / 0.167
				highestDLRatio = countryorstatedata[data.name]['summary']['highestDL'] / highestDL / 0.167
				lowestUPRatio = countryorstatedata[data.name]['summary']['lowestUP'] / lowestUP / 0.167
				highestUPRatio = countryorstatedata[data.name]['summary']['highestUP'] / highestUP / 0.167
				//console.log(data.name)
				//console.log(Math.floor(lowestDLRatio))
				var eval =  Math.floor(highestDLRatio+highestUPRatio)
				if(eval < 1){
					return 0xffbaba
				}else if(eval < 2){
					return 0xff7b7b
				}else if(eval < 3){
					return 0xff5252
				}else if(eval < 4){
					return 0xff0000
				}else if(eval < 5){
					return 0xa70000
				}else if(eval >= 5){
					return 0x5b0000
				}else{//get anything with an invalid eval
					return 0xffffff
				}
			}
		},

		getInternetYearColor: function(countryorstatedata, year, shapesToRecolor, originalColorSet){

			var lowestDLRatio, highestDLRatio, lowestUPRatio, highestUPRatio
			var lowestDL, highestDL, lowestUP, highestUP

			if(year == '100'){

				for (i=0; i<shapesToRecolor.length;i++) {
					
					shapesToRecolor[i].material.color.setHex(originalColorSet[i]); 
				}	
				return
			}else if(year == '08'){

			 	lowestDL = 56
				highestDL = 29295.5
				lowestUP = 25
				highestUP = 18384.9
			}else if(year == '09'){
				
				lowestDL = 75
				highestDL = 2000
				lowestUP = 50
				highestUP = 21502.5
			}else if(year == '10'){

				lowestDL = 1000
				highestDL = 36980.7
				lowestUP = 250
				highestUP = 20690					
			}else if(year == '11'){
				
				lowestDL = 2000
				highestDL = 44600.3
				lowestUP = 750
				highestUP = 27808.1
			}else if(year == '12'){

				lowestDL = 4000
				highestDL = 50898.3
				lowestUP = 1000
				highestUP = 39401.5				
			}else if(year == '13'){

				lowestDL = 6000
				highestDL = 71561.5
				lowestUP = 2000
				highestUP = 59391.5				
			}else if(year == '14'){
				lowestDL = 8000
				highestDL = 100270
				lowestUP = 4000
				highestUP = 92062.7	
			}

			//wipes all colors from the current canvas
			for(j=0; j<shapesToRecolor.length;j++){
				shapesToRecolor[j].material.color.setHex(0xffffff); 
			}

			for (var index in countryorstatedata) {

				if(index !== 'region' && index!=='country' && !(typeof countryorstatedata[index] === 'undefined')){
					console.log(index)
					lowestDLRatio = countryorstatedata[index]['summary'][year]['lowestDL'] / lowestDL / 0.167
					highestDLRatio = countryorstatedata[index]['summary'][year]['highestDL'] / highestDL / 0.167
					lowestUPRatio = countryorstatedata[index]['summary'][year]['lowestUP'] / lowestUP / 0.167
					highestUPRatio = countryorstatedata[index]['summary'][year]['highestUP'] / highestUP / 0.167

					var eval =  Math.floor(highestDLRatio+highestUPRatio)
					console.log(eval)
					if(eval < 1){
						
						for (var j = 0; j < shapesToRecolor.length; j++) {
							if(shapesToRecolor[j].name == index){
								shapesToRecolor[j].material.color.setHex(0xffbaba); 
							}
						}
						
					}else if(eval < 2){
						for (var j = 0; j < shapesToRecolor.length; j++) {
							if(shapesToRecolor[j].name == index){
								shapesToRecolor[j].material.color.setHex(0xff7b7b); 
							}
						}
					}else if(eval < 3){
						for (var j = 0; j < shapesToRecolor.length; j++) {
							if(shapesToRecolor[j].name == index){
								shapesToRecolor[j].material.color.setHex(0xff5252); 
							}
						}
					}else if(eval < 4){
						for (var j = 0; j < shapesToRecolor.length; j++) {
							if(shapesToRecolor[j].name == index){
								shapesToRecolor[j].material.color.setHex(0xff0000); 
							}
						}
					}else if(eval < 5){
						for (var j = 0; j < shapesToRecolor.length; j++) {
							if(shapesToRecolor[j].name == index){
								shapesToRecolor[j].material.color.setHex(0xa70000);
							}
						}						 
					}else if(eval >= 5){
						for (var j = 0; j < shapesToRecolor.length; j++) {
							if(shapesToRecolor[j].name == index){
								shapesToRecolor[j].material.color.setHex(0x5b0000); 
							}
						}
					}else{
						for (var j = 0; j < shapesToRecolor.length; j++) {
							if(shapesToRecolor[j].name == index){
								shapesToRecolor[j].material.color.setHex(0xffffff);
							}
						}						
					}			
				}
				
			}	
		},

		getLatency: function(countryorstatedata, year, shapesToRecolor, originalColorSet){

			//make these variables into constants
			//arbitrarily picked constant values for now
			var lowestDLNoYr = 0, highestDLNoYr = 26.1488, lowestUPNoYr = 0, highestUPNoYr = 465.678
			var lowestDLRatio, highestDLRatio, lowestUPRatio, highestUPRatio
			var lowestDL, highestDL, lowestUP, highestUP

           // "highestDL": 2987.69/2000 - 
           // "highestUP": 619.174/21502.5 - 
           // sum 1.52 

			if(year == '100'){

			}else if(year == '08'){

			 	lowestDL = 0
				highestDL = 0
				lowestUP = 0
				highestUP = 0
			}else if(year == '09'){
				
				lowestDL = 0
				highestDL = 17.0014
				lowestUP = 0
				highestUP = 417.669
			}else if(year == '10'){

				lowestDL = 0
				highestDL = 23.5853
				lowestUP = 0
				highestUP = 455.03				
			}else if(year == '11'){
				
				lowestDL = 0
				highestDL = 20.9725
				lowestUP = 0
				highestUP = 465.678
			}else if(year == '12'){

				lowestDL = 0
				highestDL = 26.1488
				lowestUP = 0
				highestUP = 392.161		
			}else if(year == '13'){

				lowestDL = 0
				highestDL = 10.2846
				lowestUP = 0
				highestUP = 387.982			
			}else if(year == '14'){
				lowestDL = 0
				highestDL = 11.7312
				lowestUP = 0
				highestUP = 240.653
			}

			//wipes all colors from the current canvas
			for(j=0; j<shapesToRecolor.length;j++){
				shapesToRecolor[j].material.color.setHex(0xffffff); 
			}

			for (var index in countryorstatedata) {

				if(index!=='country' && !(typeof countryorstatedata[index] === 'undefined')){

					if(year == ''){
						//lowestDLRatio = countryorstatedata[index]['summary']['lowestPL'] / lowestDL / 0.167
						//highestDLRatio = countryorstatedata[index]['summary']['highestPL'] / highestDL / 0.167
						lowestUPRatio = countryorstatedata[index]['summary']['lowestLAT'] / lowestUPNoYr / 0.167
						highestUPRatio = countryorstatedata[index]['summary']['highestLAT'] / highestUPNoYr / 0.167
					}else{
						//lowestDLRatio = countryorstatedata[index]['summary'][year]['lowestPL'] / lowestDL / 0.167
						//highestDLRatio = countryorstatedata[index]['summary'][year]['highestPL'] / highestDL / 0.167
						lowestUPRatio = countryorstatedata[index]['summary'][year]['lowestLAT'] / lowestUP / 0.167
						highestUPRatio = countryorstatedata[index]['summary'][year]['highestLAT'] / highestUP / 0.167
					}

					var eval =  Math.floor(highestUPRatio)
					if(index == 'missouri'){
						console.log(index)
						console.log(eval)
					}
					if(eval < 1){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xffbaba); 
							}
						}
					}else if(eval < 2){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xff7b7b); 
							}
						}
					}else if(eval < 3){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){						
								shapesToRecolor[i].material.color.setHex(0xff5252); 
							}
						}
					}else if(eval < 4){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xff0000);
							}
						} 
					}else if(eval < 5){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xa70000); 
							}
						}
					}else if(eval >= 5){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0x5b0000); 
							}
						}
					}else{
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xffffff);
							}
						}
					}				
				}
			}	
		},
		getPacketloss: function(countryorstatedata, year, shapesToRecolor, originalColorSet){

			//make these variables into constants
			//arbitrarily picked constant values for now
			var lowestDLNoYr = 0, highestDLNoYr = 26.1488, lowestUPNoYr = 0, highestUPNoYr = 465.678
			var lowestDLRatio, highestDLRatio, lowestUPRatio, highestUPRatio
			var lowestDL, highestDL, lowestUP, highestUP

           // "highestDL": 2987.69/2000 - 
           // "highestUP": 619.174/21502.5 - 
           // sum 1.52 

			if(year == '100'){

			}else if(year == '08'){

			 	lowestDL = 0
				highestDL = 0
				lowestUP = 0
				highestUP = 0
			}else if(year == '09'){
				
				lowestDL = 0
				highestDL = 17.0014
				lowestUP = 0
				highestUP = 417.669
			}else if(year == '10'){

				lowestDL = 0
				highestDL = 23.5853
				lowestUP = 0
				highestUP = 455.03				
			}else if(year == '11'){
				
				lowestDL = 0
				highestDL = 20.9725
				lowestUP = 0
				highestUP = 465.678
			}else if(year == '12'){

				lowestDL = 4000
				highestDL = 26.1488
				lowestUP = 1000
				highestUP = 392.161		
			}else if(year == '13'){

				lowestDL = 0
				highestDL = 10.2846
				lowestUP = 0
				highestUP = 387.982			
			}else if(year == '14'){
				lowestDL = 0
				highestDL = 11.7312
				lowestUP = 0
				highestUP = 240.653
			}

			//wipes all colors from the current canvas
			for(j=0; j<shapesToRecolor.length;j++){
				shapesToRecolor[j].material.color.setHex(0xffffff); 
			}

			for (var index in countryorstatedata) {

				if(index!=='country' && !(typeof countryorstatedata[index] === 'undefined')){

					if(year == ''){

						lowestDLRatio = countryorstatedata[index]['summary']['lowestPL'] / lowestDLNoYr / 0.167
						highestDLRatio = countryorstatedata[index]['summary']['highestPL'] / highestDLNoYr  / 0.167
						//lowestUPRatio = countryorstatedata[index]['summary']['lowestUP'] / lowestUP / 0.167
						//highestUPRatio = countryorstatedata[index]['summary']['highestUP'] / highestUP / 0.167
					}else{

						lowestDLRatio = countryorstatedata[index]['summary'][year]['lowestPL'] / lowestDL / 0.167
						highestDLRatio = countryorstatedata[index]['summary'][year]['highestPL'] / highestDL / 0.167
						//lowestUPRatio = countryorstatedata[index]['summary'][year]['lowestUP'] / lowestUP / 0.167
						//highestUPRatio = countryorstatedata[index]['summary'][year]['highestUP'] / highestUP / 0.167
					}


					var eval =  Math.floor(highestDLRatio)
					//console.log("packetlosss"+eval)
					if(eval < 1){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xffbaba); 
							}
						}
					}else if(eval < 2){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xff7b7b);
							}
						} 
					}else if(eval < 3){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xff5252); 
							}
						}
					}else if(eval < 4){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xff0000); 
							}
						}
					}else if(eval < 5){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xa70000); 
							}
						}
					}else if(eval >= 5){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0x5b0000);
							}
						} 
					}else{
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xffffff);
							}
						}
					}				
				}
			}	
		},

		getGrowthRates: function(countryorstatedata, year, shapesToRecolor, originalColorSet){

			var lowestDLRatio, highestDLRatio, lowestUPRatio, highestUPRatio
			var lowestDL, highestDL, lowestUP, highestUP

			var lowestDL = 56.6552, highestDL = 100270.0
			var lowestUP = 14.0, highestUP = 92062.7

			//wipes all colors from the current canvas
			for(j=0; j<shapesToRecolor.length;j++){
				shapesToRecolor[j].material.color.setHex(0xffffff); 
			}

			for (var index in countryorstatedata) {

				if(index!=='country' && !(typeof countryorstatedata[index] === 'undefined')){

					lowestDLRatio = countryorstatedata[index]['summary']['lowestDL'] 
					highestDLRatio = countryorstatedata[index]['summary']['highestDL'] 
					//lowestUPRatio = countryorstatedata[index]['summary']['lowestUP'] 
					//highestUPRatio = countryorstatedata[index]['summary']['highestUP'] 

					var eval =  Math.floor(((highestDLRatio-lowestDLRatio)/lowestDLRatio))
					console.log(index)
					console.log(eval)
					if(eval < 10){

						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
	
								shapesToRecolor[i].material.color.setHex(0xffbaba); 
							}
						}
						
					}else if(eval < 20){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xff7b7b); 
							}
						}
					}else if(eval < 30){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xff5252); 
							}
						}
					}else if(eval < 40){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xff0000);
							}
						} 
					}else if(eval < 50){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xa70000); 
							}
						}
					}else if(eval >= 50){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0x5b0000); 
							}
						}
					}else{
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xffffff);
							}
						}
					}				
				}
			}
		},

		getInternetValue: function(countryorstatedata, year, shapesToRecolor, originalColorSet){

			var lowestDLRatio, highestDLRatio, lowestUPRatio, highestUPRatio
			var lowestDL, highestDL, lowestUP, highestUP

			var lowestDL = 1.74948, highestDL = 24.3186
			var lowestUP = 6.34959, highestUP = 128.866

			//wipes all colors from the current canvas
			for(j=0; j<shapesToRecolor.length;j++){
				shapesToRecolor[j].material.color.setHex(0xffffff); 
			}

			for (var index in countryorstatedata) {

				if(index!=='country' && !(typeof countryorstatedata[index] === 'undefined')){

					//lowestDLRatio = countryorstatedata[index]['summary']['lowestDL'] / 1.74948
					highestDLRatio = countryorstatedata[index]['summary']['highestDL'] / 24.3186
					//lowestUPRatio = countryorstatedata[index]['summary']['lowestUP'] / 634959
					highestUPRatio = countryorstatedata[index]['summary']['highestUP'] / 128.866

					var eval =  Math.floor(highestDLRatio+highestUPRatio)
					console.log(index)
					console.log(eval)
					if(eval < 1){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xffbaba); 
							}
						}
						
					}else if(eval < 2){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xff7b7b); 
							}
						}
					}else if(eval < 3){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xff5252); 
							}
						}
					}else if(eval < 4){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xff0000); 
							}
						}
					}else if(eval < 5){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xa70000);
							}
						} 
					}else if(eval >= 5){
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0x5b0000); 
							}
						}
					}else{
						for (var i = 0; i < shapesToRecolor.length; i++) {
							if(shapesToRecolor[i].name == index){
								shapesToRecolor[i].material.color.setHex(0xffffff);
							}
						}
					}				
				}
			}
		},

		setCameraPosition: function(x, y, z, lx, lz) {
			this.CAMERA_X = x;
			this.CAMERA_Y = y;
			this.CAMERA_Z = z;
			this.CAMERA_LX = lx;
			this.CAMERA_LZ = lz;
		},

		moveCamera: function() {
			var speed = 0.2;
			var target_x = (this.CAMERA_X - this.camera.position.x) * speed;
			var target_y = (this.CAMERA_Y - this.camera.position.y) * speed;
			var target_z = (this.CAMERA_Z - this.camera.position.z) * speed;

			this.camera.position.x += target_x;
			this.camera.position.y += target_y;
			this.camera.position.z += target_z;

			this.camera.lookAt( {x: this.CAMERA_LX, y: 0, z: this.CAMERA_LZ } );
		},

		animate: function() {

			if( this.CAMERA_X != this.camera.position.x ||
				this.CAMERA_Y != this.camera.position.y ||
				this.CAMERA_Z != this.camera.position.z) {
				this.moveCamera();
			}

			// find intersections
			var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
			this.projector.unprojectVector( vector, this.camera );
			var raycaster = new THREE.Ray( this.camera.position, vector.subSelf( this.camera.position ).normalize() );
			var intersects = raycaster.intersectObjects( this.scene.children );

			var objects = this.scene.children;

			if ( intersects.length > 1 ) {
				if(this.INTERSECTED != intersects[ 0 ].object) {
					if (this.INTERSECTED) {
						for(i = 0; i < objects.length; i++) {
							if (objects[i].name == this.INTERSECTED.name) {
								objects[i].material.opacity = 0.5;
								objects[i].scale.z = 1;
							}
						}
						this.INTERSECTED = null;
					}
				}

				this.INTERSECTED = intersects[ 0 ].object;
				for(i = 0; i < objects.length; i++) {
					if (objects[i].name == this.INTERSECTED.name) {
						objects[i].material.opacity = 1.0;
						objects[i].scale.z = 5;
					}
				}

			} else if (this.INTERSECTED) {
				for(i = 0; i < objects.length; i++) {
					if (objects[i].name == this.INTERSECTED.name) {
						objects[i].material.opacity = 0.5;
						objects[i].scale.z = 1;
					}
				}
				this.INTERSECTED = null;
			}

			this.render();
		},

		render: function() {

			// actually render the scene
			this.renderer.render(this.scene, this.camera);
		}
	};

	function init() {

		worldMap = new Map();

		worldMap.init_d3();
		worldMap.init_tree();

		worldMap.add_light(0, 3000, 0, 1.0, 0xFFFFFF);
		worldMap.add_plane(1400, 700, 30, 0xEEEEEE);

		$.when($.getJSON("shapes/stateshapes.json")).then(function(data){

			$.when($.getJSON("internetdata/statedatafinal.json")).then(function(statedata){
				worldMap.add_US_states(data, statedata)
			})
		})

		$.when(	$.getJSON("shapes/countryshapes.json")).then(function(data){

			$.when($.getJSON("internetdata/countrydatafinal.json")).then(function(countrydata){
				worldMap.add_countries(data, countrydata)
			})
			// request animation frame
			var onFrame = window.requestAnimationFrame;

			function tick(timestamp) {
				worldMap.animate();

				if(worldMap.INTERSECTED) {
					$('#country-name').html(worldMap.INTERSECTED.name);
					/*data = "aftr"
					/* Initialize tooltip */
					/*var tip = d3.tip().attr('class', 'd3-tip').html(function(d) { return d; });
					var w = 20,
						h = 20
					var vis = d3.select('#country-name')
						.append('svg')
						.attr('width',w)
						.attr('height', h)
					/* Invoke the tip in the context of your visualization */
					//vis.call(tip)

					/*vis.selectAll('rect')
					  .data(data)
					.enter().append('rect')
					  .attr('width', w)
					  .attr('height', h)
					  .on('mouseover', tip.show)
					  .on('mouseout', tip.hide)	*/

				} else {
					$('#country-name').html("");
				}

				onFrame(tick);
			}

			onFrame(tick);

			document.addEventListener( 'mousemove', onDocumentMouseMove, false );
			window.addEventListener( 'resize', onWindowResize, false );

		})
	}

	function onDocumentMouseMove( event ) {

		event.preventDefault();

		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	}

	function onWindowResize() {

		windowHalfX = window.innerWidth / 2;
		windowHalfY = window.innerHeight / 2;

		worldMap.camera.aspect = window.innerWidth / window.innerHeight;
		worldMap.camera.updateProjectionMatrix();

		worldMap.renderer.setSize( window.innerWidth, window.innerHeight );
	}

	$('ul.list-unstyled li.sub-nav a').click(function() {
		switch (this.hash) {
		   case "#africa":
			  worldMap.setCameraPosition(100, 320, 200, 100, 50);
			  break;
		   case "#europe":
			  worldMap.setCameraPosition(75, 210, -75, 75, -150);
			  break;
		   case "#asiapacific":
			  worldMap.setCameraPosition(400, 350, 100, 400, -100);
			  break;
		   case "#merica":
			  worldMap.setCameraPosition(-300, 350, -90, -300, -120);
			  break;
		   case "#latinamerica":
		   	  worldMap.setCameraPosition(-200, 350, 250, -200, 120);
			  break;
		   case "#oceania":
			  worldMap.setCameraPosition(500, 270, 300, 500, 120);
			  break;
		   case "#all":
			  worldMap.setCameraPosition(0, 1000, 500, 0, 0);
			  break;
		   case "#2008":
				$.when($.getJSON("internetdata/countrydatafinal.json")).then(function(countrydata){
					worldMap.getInternetYearColor(countrydata,'08', shapesRendered, originalColors)
				})
				$.when($.getJSON("internetdata/statedatafinal.json")).then(function(statedata){
					worldMap.getInternetYearColor(statedata,'08', shapesRenderedUS, originalColorsUS)
				})
				currentYear = '08'
				break;
		   case "#2009":
				$.when($.getJSON("internetdata/countrydatafinal.json")).then(function(countrydata){
					worldMap.getInternetYearColor(countrydata,'09', shapesRendered, originalColors)
				})
				$.when($.getJSON("internetdata/statedatafinal.json")).then(function(statedata){
					worldMap.getInternetYearColor(statedata,'09', shapesRenderedUS, originalColorsUS)
				})
				currentYear = '09'
				break;
		   case "#2010":
				$.when($.getJSON("internetdata/countrydatafinal.json")).then(function(statedata){
					worldMap.getInternetYearColor(statedata,'10', shapesRendered, originalColors)
				})
				$.when($.getJSON("internetdata/statedatafinal.json")).then(function(statedata){
					worldMap.getInternetYearColor(statedata,'10', shapesRenderedUS, originalColorsUS)
				})
				currentYear = '10'
				break;
		   case "#2011":
				$.when($.getJSON("internetdata/countrydatafinal.json")).then(function(countrydata){
					worldMap.getInternetYearColor(countrydata,'11', shapesRendered, originalColors)
				})
				$.when($.getJSON("internetdata/statedatafinal.json")).then(function(statedata){
					worldMap.getInternetYearColor(statedata,'11', shapesRenderedUS, originalColorsUS)
				})
				currentYear = '11'
				break;
		   case "#2012":
				$.when($.getJSON("internetdata/countrydatafinal.json")).then(function(countrydata){
					worldMap.getInternetYearColor(countrydata,'12', shapesRendered, originalColors)
				})
				$.when($.getJSON("internetdata/statedatafinal.json")).then(function(statedata){
					worldMap.getInternetYearColor(statedata,'12', shapesRenderedUS, originalColorsUS)
				})
				currentYear = '12'
				break;
		   case "#2013":
				$.when($.getJSON("internetdata/countrydatafinal.json")).then(function(countrydata){
					worldMap.getInternetYearColor(countrydata,'13', shapesRendered, originalColors)
				})
				$.when($.getJSON("internetdata/statedatafinal.json")).then(function(statedata){
					worldMap.getInternetYearColor(statedata,'13', shapesRenderedUS, originalColorsUS)
				})
				currentYear = '13'
				break;
		   case "#2014":
				$.when($.getJSON("internetdata/countrydatafinal.json")).then(function(countrydata){
					worldMap.getInternetYearColor(countrydata,'14', shapesRendered, originalColors)
				})
				$.when($.getJSON("internetdata/statedatafinal.json")).then(function(statedata){
					worldMap.getInternetYearColor(statedata,'14', shapesRenderedUS, originalColorsUS)
				})
				currentYear = '14'
				break;
		   case "#average":
		   		$.when($.getJSON("internetdata/countrydatafinal.json")).then(function(countrydata){
					worldMap.getInternetYearColor(countrydata,'100', shapesRendered, originalColors)
				})
				$.when($.getJSON("internetdata/statedatafinal.json")).then(function(statedata){
					worldMap.getInternetYearColor(statedata,'100', shapesRenderedUS, originalColorsUS)
				})
				currentYear = ''
				break;
		   case "#growth":
		   		$.when($.getJSON("internetdata/countrydatafinal.json")).then(function(countrydata){
					worldMap.getGrowthRates(countrydata,currentYear, shapesRendered, originalColors)
				})
				$.when($.getJSON("internetdata/statedatafinal.json")).then(function(statedata){
					worldMap.getGrowthRates(statedata,currentYear, shapesRenderedUS, originalColorsUS)
				})
		   		break;
		   case "#packetloss":
		   		$.when($.getJSON("internetdata/countryqualityfinal.json")).then(function(countrydata){
					worldMap.getPacketloss(countrydata,currentYear, shapesRendered, originalColors)
				})
				$.when($.getJSON("internetdata/statequalityfinal.json")).then(function(statedata){
					worldMap.getPacketloss(statedata,currentYear, shapesRenderedUS, originalColorsUS)
				})
		   		break;
		   case "#latency":
		   		$.when($.getJSON("internetdata/countryqualityfinal.json")).then(function(countrydata){
					worldMap.getLatency(countrydata,currentYear, shapesRendered, originalColors)
				})
				$.when($.getJSON("internetdata/statequalityfinal.json")).then(function(statedata){
					worldMap.getLatency(statedata,currentYear, shapesRenderedUS, originalColorsUS)
				})
		   		break;
		   case "#internetvalue":
		   		$.when($.getJSON("internetdata/countrydailyvaluefinal.json")).then(function(countrydata){
					worldMap.getInternetValue(countrydata,currentYear, shapesRendered, originalColors)
				})
				$.when($.getJSON("internetdata/statedailyvaluefinal.json")).then(function(statedata){
					worldMap.getInternetValue(statedata,currentYear, shapesRenderedUS, originalColorsUS)
				})
		   		break;
		   case "#averagemetrics"://goes back to latency map
		   		$.when($.getJSON("internetdata/countrydatafinal.json")).then(function(countrydata){
					worldMap.getInternetYearColor(countrydata,'100', shapesRendered, originalColors)
				})
				$.when($.getJSON("internetdata/statedatafinal.json")).then(function(statedata){
					worldMap.getInternetYearColor(statedata,'100', shapesRenderedUS, originalColorsUS)
				})
		   		break;
		}
	});

	window.onload = init;

}());
