window.requestAnimFrame = function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(a) {
        window.setTimeout(a, 1E3 / 60)
    }
}();

var Defender = (function(){ 
	var IE = "ActiveXObject" in window ;
	var gameCanvas , gameCtx ;
	var defenderList = [] ;
	var imageList = ["background","beginner_stand","swordman","atkUp","snail_move","invoke","choose_soldier","choose_soldier_back","description","close","reset","confirm","gameover","win","beginner_hit","beginner","beginner_attack","swordman_hit","beginner_attack_effect","snail","snail_hit","number_damage","snail_die","hp","hp_bar"] ;
	var loadImageProgress = 0 ;
	var imgMap = {} ;
	var canvasMap = {} ;
	var canvasWidth = 1350 , canvasHeight = 780 ;
	var roadBottomY = 450 ;
	var roadTopY = 250 ;
	var nowPage = 'loadPage' ; 
	var nowStage = 'stage1' ;
	var mySoldierList = [] ;
	var mouseOver = 'none' ;
	var nowChooseSoldier ;
	var roleList = ['beginner','swordman','archer','magician'] ;
	var monsterIdList = ['snail'];
	var roleDescriptionList = ['beginner','swordman','archer','magician'] ;
	var monsterDescriptionList = ['snail'] ;
	var soldierMap = {} ; 
	var monsterMap = {} ;
	var monsterList = [] ;
	var animationMap = {} ;
	var animationList = [] ;

	var common = {
		createAnimation : function(obj){
			animationList.push(obj);
		},
		cloneCanvas : function(canvas){
			var newCanvas = document.createElement("canvas") ;
			var newContent = newCanvas.getContext("2d") ;
			newCanvas.width = canvas.width ;
			newCanvas.height = canvas.height ;
			newContent.drawImage(canvas,0,0) ;
			return newCanvas ;
		},
		clone : function(obj) {
		    if ( null === obj || "object" !== typeof obj ) 
		    	return obj;
		    if (obj instanceof Date) {
		        var copy = new Date();
		        copy.setTime(obj.getTime());
		        return copy;
		    }
		    if (obj instanceof Array) {
		        var copy = [];
		        for ( var i = 0, len = obj.length; i < len; ++i) {
		            copy[i] = common.clone(obj[i]);
		        }
		        return copy;
		    }
		    if (obj instanceof Object) {
		        var copy = {};
		        for (var attr in obj) {
		        	if ( obj[attr].tagName === "CANVAS" ){
		        		copy[attr] = common.cloneCanvas(obj[attr]);
		        	} else if (obj.hasOwnProperty(attr)) copy[attr] = common.clone(obj[attr]);
		        }
		        return copy;
		    }
		},
		initNumberDamage : function(){
			for ( var i = 0 ; i < 10 ; i ++ ){
				var numberCanvas = canvasMap["number_damage"] ;
				var canvas = document.createElement("canvas") ;
				var ctx = canvas.getContext('2d');
				var w = numberCanvas.width / 10  ;
				var h = numberCanvas.height ;
				canvas.width = w ;
				canvas.height = h ;
				ctx.drawImage(numberCanvas,w*i,0,w,h,0,0,w,h);
				canvasMap["number_damage_"+i] = canvas ;
				animationMap['number_damage_'+i] = {
					frames : 1 ,
					width : w ,
					height : h 
				}						
			}
		},
		initSoldierMap : function(){
			var beginner = common.createSoldier(0,15,60,150,1,10,false,3,5,3,2,1,2,-27,7) ;
			soldierMap['beginner'] = beginner ;
			
			/*
			var swordman = common.createSoldier(1,30,75,170,1,20,false,5) ;
			var effect = common.createEffect(0,0,1,10,2) ;
			var atkUp = common.createSkill("atkUp","add atk.",1,[],0,effect) ;
			swordman.skill.push(atkUp);
			soldierMap['swordman'] = swordman ;
			*/
			
		},
		initMonsterMap : function(){
			var snail = common.createMonster(0,0,370,100,100,3,1,[],[],9,1,9,true);
			monsterMap['snail'] = snail ;
		},
		createMonsterSkill : function(){

		},
		createMonster : function(id,x,y,nowHp,maxHp,def,speed,skill,effect,moveFrame,hitFrame,dieFrame,hitAble){
			var monster = {
				state : "move" ,
				id : id || 0 ,
				x : x || 0 ,
				y : y || 0 ,
				nowHp : nowHp || 0 ,
				maxHp : maxHp || 0 ,
				def : def || 0 ,
				speed : speed || 0 ,	//per 20ms 
				skill : skill || [] ,
				effect : effect || [] ,
				hitAble : hitAble || true ,
				move : {
					nowFrame : 0 ,
					totalFrame : moveFrame ,
					canvas : null 
				} ,
				hit : {
					nowFrame : 0 ,
					totalFrame : hitFrame ,
					canvas : null 
				},
				die : {
					nowFrame : 0 ,
					totalFrame : dieFrame ,
					canvas : null 
				} ,
				init : function(){
					this.setStateCanvas();
					return this ;
				},
				showNumberDamage : function(damage){
					var d = damage.toString();
					var dx = 0 ;
					var dy = 0 ;
					for ( var i = 0 ; i < d.length ; i ++ ){
						common.createAnimation({
							canvas : canvasMap["number_damage_"+d[i]] ,
							x : this.x + dx ,
							y : this.y + dy ,
							dy : -1 ,
							dx : 0 , 
							nowFrame : 0 ,
							delay : 20 ,
							timer : 0 ,
							totalFrame : 1 ,
							width : canvasMap["number_damage_"+d[i]].width , 
							height : canvasMap["number_damage_"+d[i]].height  
						});
						dx += 30 ;
						dy /= 4 ;
						dy = (1 - dy) * 4  ;
					}
					
				},
				isDie : function(){
					this.nowHp = 0 ;
					this.hitAble = false ;
					this.state = "die" ;
				},
				isMove : function(){
					if ( stage.isGameOver === true || stage.isGameWin === true )
						return ;
					this.x += this.speed ;
					if ( this.x >= canvasWidth ){
						stage.isGameOver = true ;
					}
				},
				showMonster : function(){
					var state = this.state ;
					var nowFrame = this[state].nowFrame ;
					var totalFrame = this[state].totalFrame ;
					var canvas = this[state].canvas ;
					var w = this[state].w ;
					var h = this[state].h ;
					gameCtx.drawImage(canvas,w*nowFrame,0,w,h,this.x,this.y,w,h);
					if ( this[state].timer < this[state].delay  ){
						this[state].timer ++ ;
					} else if ( this[state].timer >= this[state].delay  ){
						this[state].nowFrame  ++ ;
						this[state].timer = 0 ;
						if ( this[state].nowFrame >= this[state].totalFrame ){
							this[state].nowFrame = 0 ;
							if ( this.nowHp > 0 )
								this.state = "move" ;
							else {
								monsterList.splice(monsterList.indexOf(this),1) ;
							}
						}
					}
					
				},
				showHp : function(){
					gameCtx.drawImage(canvasMap["hp_bar"],this.x-5,this.y-25);
					gameCtx.drawImage(canvasMap["hp"],this.x-2,this.y-22.5,canvasMap["hp"].width*(this.nowHp/this.maxHp)*46,canvasMap["hp"].height+0.5);
					//gameCtx.fillText(this.nowHp+ '/' + this.maxHp ,this.x,this.y-10) ;
				},
				isHit : function(data){
					this.state = "hit" ;
					var atk = data.atk ;
					var type = roleList[data.id] ;
					var damage = atk - this.def ;
					this.nowHp -= damage ;
					common.createAnimation({
						canvas : canvasMap[type+"_hit"] ,
						x : this.x ,
						y : this.y ,
						nowFrame : 0 ,
						delay : 5 ,
						timer : 0 ,
						totalFrame : animationMap[type+"_hit"].frames ,
						width : animationMap[type+"_hit"].width , 
						height : animationMap[type+"_hit"].height  
					});
					this.showNumberDamage(damage) ;
				},
				showAll : function(){
					this.showMonster();
					if ( this.state !== "die" )
						this.showHp();
				},				
				setStateCanvas : function(){
					var w = canvasMap[monsterIdList[this.id]+"_move"].width ;
					var h = canvasMap[monsterIdList[this.id]+"_move"].height ;
					var canvas = canvasMap[monsterIdList[this.id]+"_move"] ;
					this.move = {
						nowFrame : 0 ,
						totalFrame : moveFrame ,
						w : w / moveFrame ,
						h : h ,
						canvas : canvas ,
						delay : 10 ,
						timer : 0 
					}

					var w = canvasMap[monsterIdList[this.id]+"_hit"].width ;
					var h = canvasMap[monsterIdList[this.id]+"_hit"].height ;
					var canvas = canvasMap[monsterIdList[this.id]+"_hit"] ;
					this.hit = {
						nowFrame : 0 ,
						totalFrame : hitFrame ,
						w : w / hitFrame ,
						h : h ,
						canvas : canvas ,
						delay : 10 ,
						timer : 0 
					}

					var w = canvasMap[monsterIdList[this.id]+"_die"].width ;
					var h = canvasMap[monsterIdList[this.id]+"_die"].height ;
					var canvas = canvasMap[monsterIdList[this.id]+"_die"] ;
					this.die = {
						nowFrame : 0 ,
						totalFrame : dieFrame ,
						w : w / dieFrame ,
						h : h ,
						canvas : canvas ,
						delay : 10 ,
						timer : 0 
					}

				}
			}.init();
			return monster
		},
		createSoldier : function(id,atk,speed,range,level,transferLevel,isPicked,hitFrame,standFrame,attackFrame,attackEffectFrame,attackAnimationFrame,attackAnimationBeginFrame,attackAnimationDx,attackAnimationDy){
			var soldier = {
				state : "stand" ,
				stand : {
					nowFrame : 0 ,
					totalFrame : 0 ,
					canvas : null 
				} ,
				attack : {
					nowFrame : 0 ,
					totalFrame : 0 ,
					canvas : null 
				},
				id : id || 0 , // role type
				atk : atk || 0 ,
				speed : speed || 0 ,  // 1 attack need sec
				range : range || 0 ,
				level : level || 1 ,
				transferLevel : transferLevel || 99999 ,
				nowExp : 0 ,
				goalExp : 0 ,
				isPicked : isPicked || false ,
				point : 0 ,	// remain skill point
				skill : [] ,
				atkTimer : 0 , 
				target : [] ,
				init : function(){
					this.setAnimationHit();
					this.setStateCanvas();
					this.setAnimationAttack();
					return this ;
				},
				isAttack : function(x,y){
					if ( stage.isGameOver === true || stage.isGameWin === true )
						return ;
					if ( this.state === "attack" ){
						if ( this.attack.animationBeginFrame === this.attack.nowFrame && this.attack.animationBoolean === false ){
							common.createAnimation({
								canvas : canvasMap[roleList[this.id]+"_attack_effect"] ,
								x : x + attackAnimationDx ,
								y : y + attackAnimationDy ,
								nowFrame : 0 ,
								timer : 0 ,
								delay : 3 ,
								totalFrame : animationMap[roleList[this.id]+"_attack_effect"].frames ,
								width : animationMap[roleList[this.id]+"_attack_effect"].width , 
								height : animationMap[roleList[this.id]+"_attack_effect"].height  
							});
							this.attack.animationBoolean = true ;
						}
						if ( this.attack.effectFrame === this.attack.nowFrame ){
							for ( var i = 0 ; i < this.target.length ; i ++  ){
								this.target[i].isHit({id:this.id,atk:this.atk}) ;
							}
							this.target = [] ;
							this.attack.animationBoolean = false ;
						}
					}
					if ( this.atkTimer >= 0 ){
						this.atkTimer -- ; 
						return ;
					} 
					for ( var i = 0 ; i < monsterList.length ; i ++ ){
						if ( Math.abs(monsterList[i].x-x) <= this.range && monsterList[i].hitAble === true ){
							this.atkTimer = this.speed ;
							this.attack.timer = 0 ;
							this.state = "attack" ;					
							this.target.push(monsterList[i]);
							return ;
						}
					}
				},
				setAnimationHit : function(){
					var img = new Image();
					var type = roleList[this.id] ;
					img.src = "img/"+type+"_hit.png" ;
					img.onload = function(){
						var width = parseFloat(this.width) / hitFrame ;
						var height = parseFloat(this.height) ;
						animationMap[type+'_hit'] = {
							frames : hitFrame ,
							width : width ,
							height : height
						}
					}
				},
				setAnimationAttack : function(){
					var img = new Image();
					var type = roleList[this.id] ;
					img.src = "img/"+type+"_attack_effect.png" ;
					img.onload = function(){
						var width = parseFloat(this.width) / attackAnimationFrame ;
						var height = parseFloat(this.height) ;
						animationMap[type+'_attack_effect'] = {
							frames : attackAnimationFrame ,
							width : width ,
							height : height
						}
					}
				},
				setStateCanvas : function(){
					var w = canvasMap[roleList[this.id]+"_stand"].width ;
					var h = canvasMap[roleList[this.id]+"_stand"].height ;
					var canvas = canvasMap[roleList[this.id]+"_stand"] ;
					this.stand = {
						nowFrame : 0 ,
						totalFrame : standFrame ,
						w : w / standFrame ,
						h : h ,
						canvas : canvas ,
						delay : 10 ,
						timer : 0 
					}

					var w = canvasMap[roleList[this.id]+"_attack"].width ;
					var h = canvasMap[roleList[this.id]+"_attack"].height ;
					var canvas = canvasMap[roleList[this.id]+"_attack"] ;
					this.attack = {
						nowFrame : 0 ,
						totalFrame : attackFrame ,
						w : w / attackFrame ,
						h : h ,
						canvas : canvas ,
						delay : 10 ,
						timer : 0 , 
						effectFrame : attackEffectFrame ,
						animationFrames : attackAnimationFrame ,
						animationBeginFrame : attackAnimationBeginFrame ,
						animationBoolean : false 
					}
				}
			}.init();
			return soldier ;
		},
		createEffect : function(type,target,valueType,value,plus){
			var effect = {
				type : type || 0 ,
				target : target || 0 ,
				valueType : valueType || 0 ,
				value : value || 0 ,
				plus : plus || 0 
			}
			return effect ;
		},
		createSkill : function(name,description,needLevel,needSkill,nowLevel,effect){
			var skill = {
				name : name || "" ,
				description : description || "" ,
				needLevel : needLevel || 1 ,
				needSkill : needSkill || [] ,
				nowLevel : nowLevel || 0 ,
				effect : effect || [] 
			}
			return skill ;
		},
		getRole : function(index){
			return roleList[index] ;
		},
		getMonster : function(index){
			return monsterIdList[index] ;
		},
		getSizeInfo : function(e){
			var temp = common.getMouseSite(e);
			var tempX = temp.x , tempY = temp.y ;
			var offsetX = SlEEPBAG.canvasAutoResizer.getGameArea().parentNode.clientWidth ;
			var offsetY = SlEEPBAG.canvasAutoResizer.getGameArea().parentNode.clientHeight ;
			var ratio = common.getRatio(offsetX,offsetY);
			var w = ratio.w , h = ratio.h ;
			return { 'temp' : temp , 'tempX': tempX , 'tempY' : tempY , 'offsetX' : offsetX , 'offsetY' : offsetY , 'ratio' : ratio , 'w' : w , 'h' : h} ;
		},
		setMouseEvent : function(over,click){
			document.onclick = click ;
			document.onmousemove = over ;
			document.ontouchend = click ;
		} ,
		setMouseEnterNone : function(){
			document.body.style.cursor = "default" ;
			mouseOver = 'none' ;
		},
		isMouseEnterRange : function(temp,x,y,sizeX,sizeY,offsetX,offsetY,ratio){
			var tempX = temp.x , tempY = temp.y ;
			var w = ratio.w , h = ratio.h ;
			if ( Math.abs( (tempX - (x + sizeX / 2) * w / canvasWidth  ) - ((offsetX - w) / 2) )  <=  sizeX / 2 * w / canvasWidth &&
				 Math.abs( (tempY - (y + sizeY / 2 ) * h / canvasHeight + 12 ) - ((offsetY - h ) / 2) )  <=  sizeY / 2 * h / canvasHeight   ) {
				return true ;
			} 
			return false ;
		},
		getMouseSite : function(e){
			var tempX , tempY ;
			if (IE) { 
				tempX = event.clientX + document.body.scrollLeft ;
				tempY = event.clientY + document.body.scrollTop;
			} else {  
				tempX = e.pageX ;
				tempY = e.pageY ;
			}   
			return {x:tempX,y:tempY} ;
		},
		getRatio : function(offsetX,offsetY){
			var ratio = canvasWidth / canvasHeight	;
			var ratio2 = offsetX / offsetY ;
			var w , h ;
			if ( ratio > ratio2 ){
				h = offsetX / ratio ;
				w = offsetX ;
			} else {
				w = offsetY * ratio ;
				h = offsetY ;
			}
			return {w:w,h:h} ;
		},
		makeAllImage : function(){
			for ( var i = 0 ; i < imageList.length ; i ++ ){
				var img = new Image();
				img.src = "img/" + imageList[i] + ".png" ;
				imgMap[imageList[i]] = img ;
				common.makeCache(i,img) ;
			}
		},
		makeCache : function(index,img){
			img.onload = function(){
				var canvas = document.createElement('canvas');
				var ctx = canvas.getContext('2d');
				canvas.width = img.width ;
				canvas.height = img.height ;
				ctx.drawImage(img,0,0,img.width,img.height) ;
				canvasMap[imageList[index]] = canvas ;
				loadImageProgress ++ ;
			}
		},
		initMySoldierList : function(){
			mySoldierList.push(common.clone(soldierMap['beginner']));
			mySoldierList.push(common.clone(soldierMap['beginner']));
			mySoldierList.push(common.clone(soldierMap['beginner']));
			mySoldierList.push(common.clone(soldierMap['beginner']));
			//mySoldierList.push(common.clone(soldierMap['swordman']));
		},
		init: function(){
			SlEEPBAG.canvasAutoResizer.load(function(self){
				self.canvasWidth = canvasWidth;
				self.canvasHeight = canvasHeight;
				var gameArea = self.getGameArea();
				document.body.appendChild(gameArea); 
			});
			gameCanvas = SlEEPBAG.canvasAutoResizer.getGameCanvas();
			gameCtx = gameCanvas.getContext("2d");
			SlEEPBAG.canvasAutoResizer.setCenter();
			common.makeAllImage();
			/*
			common.initSoldierMap();
			common.initMonsterMap();
			common.initMySoldierList();
			*/
			//
			loadPage.init();
			//
			common.repaint();
		},
		repaint : function(){
			try {
				if ( nowPage === 'loadPage' ){
					loadPage.showAll();
				}
				else if ( nowPage === 'preStage' ){
					preStage.showAll();
				} else if ( nowPage.match('stage') !== null ){
					stage[nowStage].showAll();
				}
			} catch ( e ){

			} 
			requestAnimationFrame(common.repaint);
		}
	};
	var loadPage = {
		background : {} ,
		init : function(){
			loadPage.initBackground();
		},
		initBackground : function(){
			var img = new Image();
			img.src = "img/background.png" ;
			img.onload = function(){	
				var canvas = document.createElement('canvas');
				var ctx = canvas.getContext('2d');
				canvas.width = img.width ;
				canvas.height = img.height ;
				ctx.drawImage(img,0,0,img.width,img.height) ;
				canvasMap['background'] = canvas ; 
				background = { x:0 , y :0 , w: canvas.width , h : canvas.height} ; 
			}
		},
		showBackground : function(){
			try{
				gameCtx.drawImage(canvasMap['background'],0,0) ;
			}catch(e){
				;
			}
		},
		showProgress : function(){
			gameCtx.font="50px Arial";
			gameCtx.fillText(loadImageProgress+ ' / ' +imageList.length,300,300) ;
		},
		showAll : function(){
			loadPage.showBackground();
			loadPage.showProgress();
			if ( loadImageProgress === imageList.length ){
				nowPage = 'preStage' ;
				preStage.init();
			}
		}
	}

	var preStage = {
		invokeList : [] ,
		isShowChooseSoldier : false ,
		isInitInvoke : false ,
		isPickSoldier : null ,
		nowPickInvoke : null ,
		background : {} ,
		resetButton : {} ,
		confirmButton : {} ,
		init : function(){
			common.initSoldierMap();
			common.initMonsterMap();
			common.initMySoldierList();
			common.initNumberDamage();
			preStage.isShowChooseSoldier = false ;
			preStage.isPickSoldier = null ;
			preStage.initBackground();
			preStage.initResetButton();
			preStage.initConfirmButton();
			preStage.initInvoke();			
		},
		setMouseEvent : function(a, b) {
	        document.onclick = b;
	        document.onmousemove = a;
	        document.ontouchend = b
    	},
		initBackground : function(){
			background = { x:0 , y:0 , w: canvasMap['background'].width , h: canvasMap['background'].height} ;
		},
		initResetButton : function(){
			preStage.resetButton = { x : 500 , y : 100 , w : canvasMap['reset'].width , h : canvasMap['reset'].height } ;
		},
		initConfirmButton : function(){
			preStage.confirmButton = { x : 200 , y : 100 , w : canvasMap['confirm'].width , h : canvasMap['confirm'].height } ;
		},
		initInvoke : function(){
			if ( preStage.isInitInvoke === true )
				return ;
			preStage.invokeList = [] ;
			for ( var i = 0 ; i < 12 ; i ++ ){
				preStage.invokeList.push({x:i*100+100,y:roadTopY,w:canvasMap['invoke'].width,h:canvasMap['invoke'].height,soldier:{id:-1}});
				preStage.invokeList.push({x:i*100+100,y:roadBottomY,w:canvasMap['invoke'].width,h:canvasMap['invoke'].height,soldier:{id:-1}});
			}
			preStage.isInitInvoke = true ;
		},
		toStage : function(){
			stage[nowStage].init();
			nowPage = nowStage ;
		},
		setMouseEnterInvokeOver: function(index){
			document.body.style.cursor = "pointer" ;
			mouseOver = 'invoke' + index ;
		},
		setMouseEnterInvokeClick :function(index){
			preStage.pickSoldier.init();
			preStage.nowPickInvoke = index ;
			document.body.style.cursor = "default" ;
		},
		setMouseEnterResetButtonOver: function(){
			document.body.style.cursor = "pointer" ;
			mouseOver = 'resetButton' ;
		},
		setMouseEnterConfirmButtonOver: function(){
			document.body.style.cursor = "pointer" ;
			mouseOver = 'confirmButton' ;
		},
		setMouseEnterConfirmButtonClick: function(){
			document.body.style.cursor = "default" ;
			mouseOver = 'confirmButton' ;
			preStage.toStage();
		},
		setMouseEnterResetButtonClick: function(){
			for ( var i = 0 ; i < mySoldierList.length ; i ++ ){
				mySoldierList[i].isPicked = false ;
			} 
			preStage.isInitInvoke = false ;
			preStage.init();
		},
		setMouseEnterSoldierOver: function(index){
			document.body.style.cursor = "pointer" ;
			mouseOver = 'soldier' + index ;
		},
		setMouseEnterSoldierClick: function(index){
			document.body.style.cursor = "pointer" ;
			preStage.isPickSoldier = index ;
			mouseOver = "none" ;
		},
		detectMouseEnterOver: function(temp,offsetX,offsetY,ratio){
			for ( var i = 0 ; i < preStage.invokeList.length ; i ++ ){
				if ( preStage.invokeList[i].soldier.id === -1 &&
					common.isMouseEnterRange(temp,preStage.invokeList[i].x,preStage.invokeList[i].y,preStage.invokeList[i].w,preStage.invokeList[i].h,offsetX,offsetY,ratio) ){
					preStage.setMouseEnterInvokeOver(i) ;
					return ;
				} else if (preStage.invokeList[i].soldier.id !== -1 &&
					common.isMouseEnterRange(temp,preStage.invokeList[i].x,preStage.invokeList[i].y,preStage.invokeList[i].w,preStage.invokeList[i].h,offsetX,offsetY,ratio) ) {
					preStage.setMouseEnterSoldierOver(i) ;
					return ;
				}
			}
			if ( common.isMouseEnterRange(temp,preStage.resetButton.x,preStage.resetButton.y,preStage.resetButton.w,preStage.resetButton.h,offsetX,offsetY,ratio) ){
				preStage.setMouseEnterResetButtonOver() ;
				return ;
			} else if ( common.isMouseEnterRange(temp,preStage.confirmButton.x,preStage.confirmButton.y,preStage.confirmButton.w,preStage.confirmButton.h,offsetX,offsetY,ratio) ){
				preStage.setMouseEnterConfirmButtonOver() ;
				return ;
			}
			common.setMouseEnterNone();
		},
		detectMouseEnterClick: function(temp,offsetX,offsetY,ratio){
			for ( var i = 0 ; i < preStage.invokeList.length ; i ++ ){
				if ( preStage.invokeList[i].soldier.id === -1 &&
					common.isMouseEnterRange(temp,preStage.invokeList[i].x,preStage.invokeList[i].y,preStage.invokeList[i].w,preStage.invokeList[i].h,offsetX,offsetY,ratio) ){
					preStage.setMouseEnterInvokeClick(i) ;
					return ;
				} else if (preStage.invokeList[i].soldier.id !== -1 &&
					common.isMouseEnterRange(temp,preStage.invokeList[i].x,preStage.invokeList[i].y,preStage.invokeList[i].w,preStage.invokeList[i].h,offsetX,offsetY,ratio) ){
					preStage.setMouseEnterSoldierClick(i) ;
					return ;
				}
			}
			if ( common.isMouseEnterRange(temp,preStage.resetButton.x,preStage.resetButton.y,preStage.resetButton.w,preStage.resetButton.h,offsetX,offsetY,ratio) ){
				preStage.setMouseEnterResetButtonClick() ;
				return ;
			} else if ( common.isMouseEnterRange(temp,preStage.confirmButton.x,preStage.confirmButton.y,preStage.confirmButton.w,preStage.confirmButton.h,offsetX,offsetY,ratio) ){
				preStage.setMouseEnterConfirmButtonClick() ;
				return ;
			}
			preStage.isPickSoldier = null ;
			common.setMouseEnterNone();
		},
		mouseOver :function(e){
			var info = common.getSizeInfo(e) 
			preStage.detectMouseEnterOver(info.temp,info.offsetX,info.offsetY,info.ratio);
		},
		mouseClick: function(e){
			var info = common.getSizeInfo(e) 
			preStage.detectMouseEnterClick(info.temp,info.offsetX,info.offsetY,info.ratio);
		},
		showInvoke :function(){
			for ( var i = 0 ; i < preStage.invokeList.length ; i ++ ){
				if ( preStage.invokeList[i].soldier.id === -1 ){
					gameCtx.drawImage(canvasMap['invoke'],preStage.invokeList[i].x,preStage.invokeList[i].y);
				} else {
					var state = preStage.invokeList[i].soldier.state ;
					var nowFrame = preStage.invokeList[i].soldier[state].nowFrame ;
					var canvas = preStage.invokeList[i].soldier[state].canvas ;
					var w = preStage.invokeList[i].soldier[state].w ;
					var h = preStage.invokeList[i].soldier[state].h ;
					gameCtx.drawImage(canvas,w*nowFrame,0,w,h,preStage.invokeList[i].x,preStage.invokeList[i].y,w,h);
					if ( preStage.invokeList[i].soldier[state].timer < preStage.invokeList[i].soldier[state].delay  ){
						preStage.invokeList[i].soldier[state].timer ++ ;
					} else if ( preStage.invokeList[i].soldier[state].timer >= preStage.invokeList[i].soldier[state].delay  ){
						preStage.invokeList[i].soldier[state].nowFrame  ++ ;
						preStage.invokeList[i].soldier[state].timer = 0 ;
						if ( preStage.invokeList[i].soldier[state].nowFrame >= preStage.invokeList[i].soldier[state].totalFrame ){
							preStage.invokeList[i].soldier[state].nowFrame = 0 ;
							preStage.invokeList[i].soldier.state = "stand" ;
						}
					}
				}
			}
		},
		showBackground : function(){
			gameCtx.drawImage(canvasMap['background'],background.x,background.y);
		},
		showResetButton : function(){
			gameCtx.drawImage(canvasMap['reset'],preStage.resetButton.x,preStage.resetButton.y);
		},
		showConfirmButton : function(){
			gameCtx.drawImage(canvasMap['confirm'],preStage.confirmButton.x,preStage.confirmButton.y);
		},
		showSoldierRange : function(){
			for ( var i = 0 ; i < preStage.invokeList.length ; i ++ ){
				if ( mouseOver === 'soldier' + i ){
					gameCtx.fillStyle="#2894FF";
					gameCtx.globalAlpha = 0.5;
					gameCtx.beginPath();
					gameCtx.arc(preStage.invokeList[i].x+canvasMap[common.getRole(preStage.invokeList[i].soldier.id)].width/2
						,preStage.invokeList[i].y+canvasMap[common.getRole(preStage.invokeList[i].soldier.id)].height/2,
						preStage.invokeList[i].soldier.range,
						0,Math.PI*2,true);
					gameCtx.closePath();
					gameCtx.fill();
					gameCtx.fillStyle="#000000";
					gameCtx.globalAlpha = 1;
					return ;
				}
			}
			if ( preStage.isPickSoldier !== null ){
				gameCtx.fillStyle="#2894FF";
				gameCtx.globalAlpha = 0.5;
				gameCtx.beginPath();
				gameCtx.arc(preStage.invokeList[preStage.isPickSoldier].x+canvasMap[common.getRole(preStage.invokeList[preStage.isPickSoldier].soldier.id)].width/2
					,preStage.invokeList[preStage.isPickSoldier].y+canvasMap[common.getRole(preStage.invokeList[preStage.isPickSoldier].soldier.id)].height/2,
					preStage.invokeList[preStage.isPickSoldier].soldier.range,
					0,Math.PI*2,true);
				gameCtx.closePath();
				gameCtx.fill();
				gameCtx.fillStyle="#000000";
				gameCtx.globalAlpha = 1;
				return ;
			}
		},
		showSoldierDetail : function(){
			for ( var i = 0 ; i < preStage.invokeList.length ; i ++ ){
				if ( preStage.isPickSoldier === i ) {
					var soldier = preStage.invokeList[i] ;
					gameCtx.fillText("Level:"+soldier.soldier.level,200,650);
					var exp = Math.floor(soldier.soldier.nowExp);
					gameCtx.fillText("Exp:"+exp+"/"+soldier.soldier.goalExp,200,700);
					gameCtx.fillText("Attack:"+soldier.soldier.atk,350,650);
					gameCtx.fillText("Range:"+soldier.soldier.range,350,700);
					gameCtx.fillText("Speed:"+soldier.soldier.speed,500,670);
					if ( soldier.soldier.skill.length !== 0 ){
						gameCtx.fillText("Skill:",650,670);
						for ( var i = 0 ; i < soldier.soldier.skill.length ; i ++ ){
							var skill = soldier.soldier.skill[i] ;
							gameCtx.drawImage(canvasMap[skill.name],650+i*100,670) ;
						}
					}
					return; ; 
				}
			}
		},
		showSoldierOver : function(){
			for ( var i = 0 ; i < preStage.invokeList.length ; i ++ ){
				if ( mouseOver === 'soldier' + i ) {
					var soldier = preStage.invokeList[i] ;
					gameCtx.fillText(common.getRole(soldier.soldier.id),50,650);
					gameCtx.fillText(roleDescriptionList[soldier.soldier.id],50,700);
					return ; ; 
				}
			}
		},
		showAll : function(){
			common.setMouseEvent(preStage.mouseOver,preStage.mouseClick);
			preStage.showBackground();
			preStage.showDescription();
			preStage.showResetButton();
			preStage.showConfirmButton();
			preStage.showInvoke();
			if ( preStage.isShowChooseSoldier === true )
				preStage.pickSoldier.showAll() ;
			if ( preStage.isPickSoldier !== null ) {
				preStage.showSoldierDetail();
			}
			if ( mouseOver.match('soldier') !== null  )  {
				preStage.showDescription();
				preStage.showSoldierOver();
			} 
			preStage.showSoldierRange();
		},
		showDescription : function(){
			gameCtx.drawImage(canvasMap['description'],0,600);
		},
		pickSoldier : {
			pickSoldierList : [] ,
			closeButton : { } ,
			init : function(){
				preStage.isShowChooseSoldier = true ;
				preStage.pickSoldier.pickSoldierList = [] ;
				preStage.pickSoldier.initSoldierList();
				preStage.pickSoldier.initCloseButton();
			} ,
			initSoldierList : function(){
				for ( var i = 0 , j = 0; i < mySoldierList.length ; i ++ ){
					if ( mySoldierList[i].isPicked === false ){
						var x = j*200+500 , y = 250 ;
						preStage.pickSoldier.pickSoldierList.push({x:x,y:y,w:canvasMap['choose_soldier_back'].width,h:canvasMap['choose_soldier_back'].height,soldierIndex:i});
						j ++ ;
					}
				}
			} , 
			initCloseButton : function(){
				preStage.pickSoldier.closeButton = { x : 100 , y : 100 , w : canvasMap['close'].width , h : canvasMap['close'].height } ;
			},
			setMouseEnterPickSoldierOver : function(index){
				document.body.style.cursor = "pointer" ;
				mouseOver = "pickSoldier" + index ;
			},
			setInvokeToSoldier : function(index){
				preStage.invokeList[preStage.nowPickInvoke].soldier = mySoldierList[index] ;
				preStage.pickSoldier.pickSoldierList.splice(index,1);
				preStage.invokeList[preStage.nowPickInvoke].w = canvasMap[common.getRole(mySoldierList[index].id)+"_stand"].width;
				preStage.invokeList[preStage.nowPickInvoke].h = canvasMap[common.getRole(mySoldierList[index].id)+"_stand"].height;
				mySoldierList[index].isPicked = true ;
				preStage.isShowChooseSoldier = false ;
				//preStage.init();
			},
			setMouseEnterPickSoldierClick : function(index){
				document.body.style.cursor = "pointer" ;
				preStage.pickSoldier.setInvokeToSoldier(index);
			},
			setMouseEnterCloseButtonOver : function(index){
				document.body.style.cursor = "pointer" ;
				mouseOver = "closeButton" ;
			},
			setMouseEnterCloseButtonClick : function(index){
				document.body.style.cursor = "pointer" ;
				preStage.isShowChooseSoldier = false ;
			},
			detectMouseEnterClick : function(temp,offsetX,offsetY,ratio){
				for ( var i = 0 ; i < preStage.pickSoldier.pickSoldierList.length ; i ++ ){
					if ( common.isMouseEnterRange(temp,preStage.pickSoldier.pickSoldierList[i].x,preStage.pickSoldier.pickSoldierList[i].y,preStage.pickSoldier.pickSoldierList[i].w,preStage.pickSoldier.pickSoldierList[i].h,offsetX,offsetY,ratio) ){
						preStage.pickSoldier.setMouseEnterPickSoldierClick(preStage.pickSoldier.pickSoldierList[i].soldierIndex) ;
						return ;
					}
				}
				if ( common.isMouseEnterRange(temp,preStage.pickSoldier.closeButton.x,preStage.pickSoldier.closeButton.y,preStage.pickSoldier.closeButton.w,preStage.pickSoldier.closeButton.h,offsetX,offsetY,ratio) ){
					preStage.pickSoldier.setMouseEnterCloseButtonClick(i) ;
					return ;
				}
				common.setMouseEnterNone();
			},
			detectMouseEnterOver : function(temp,offsetX,offsetY,ratio){
				for ( var i = 0 ; i < preStage.pickSoldier.pickSoldierList.length ; i ++ ){
					if ( common.isMouseEnterRange(temp,preStage.pickSoldier.pickSoldierList[i].x,preStage.pickSoldier.pickSoldierList[i].y,preStage.pickSoldier.pickSoldierList[i].w,preStage.pickSoldier.pickSoldierList[i].h,offsetX,offsetY,ratio) ){
						preStage.pickSoldier.setMouseEnterPickSoldierOver(preStage.pickSoldier.pickSoldierList[i].soldierIndex) ;
						return ;
					}
				}
				if ( common.isMouseEnterRange(temp,preStage.pickSoldier.closeButton.x,preStage.pickSoldier.closeButton.y,preStage.pickSoldier.closeButton.w,preStage.pickSoldier.closeButton.h,offsetX,offsetY,ratio) ){
					preStage.pickSoldier.setMouseEnterCloseButtonOver(i) ;
					return ;
				}
				common.setMouseEnterNone();
			},
			mouseOver : function(e){
				var info = common.getSizeInfo(e) ;
				preStage.pickSoldier.detectMouseEnterOver(info.temp,info.offsetX,info.offsetY,info.ratio);
			},
			mouseClick : function(e){
				var info = common.getSizeInfo(e) ;
				preStage.pickSoldier.detectMouseEnterClick(info.temp,info.offsetX,info.offsetY,info.ratio);
			},
			showCloseButton : function(){
				gameCtx.drawImage(canvasMap['close'],preStage.pickSoldier.closeButton.x,preStage.pickSoldier.closeButton.y);
			},
			showMySoldierBack :function(index){
				var x = preStage.pickSoldier.pickSoldierList[index].x ;
				var y = preStage.pickSoldier.pickSoldierList[index].y ;
				gameCtx.drawImage(canvasMap['choose_soldier_back'],x,y) ;
			},
			showMySoldierInfo: function(pickIndex,soldierIndex){
				var role = common.getRole(mySoldierList[soldierIndex].id) ;
				var x = preStage.pickSoldier.pickSoldierList[pickIndex].x ;
				var y = preStage.pickSoldier.pickSoldierList[pickIndex].y ;
				gameCtx.font="30px Arial";
				gameCtx.drawImage(canvasMap[role],x,150);
				gameCtx.fillText("Level : "+mySoldierList[soldierIndex].level,x,250) ;
				gameCtx.fillText("Dmage : "+mySoldierList[soldierIndex].atk,x,300) ;
				gameCtx.fillText("Speed : "+mySoldierList[soldierIndex].speed,x,350) ;
				gameCtx.fillText("Range : "+mySoldierList[soldierIndex].range,x,400) ;
				gameCtx.fillText("Exp : "+mySoldierList[soldierIndex].nowExp+ " / "+mySoldierList[soldierIndex].goalExp,x,450) ;
				gameCtx.fillText("Point : "+mySoldierList[soldierIndex].point,x,500) ;
				for ( var i = 0 ; i < mySoldierList[soldierIndex].skill.length ; i ++ ){
					var skill = mySoldierList[soldierIndex].skill[i] ;
					gameCtx.drawImage(canvasMap[skill.name],x,550+i*100) ;
					gameCtx.fillText("Skill Level : "+skill.nowLevel,x,600+i*100) ;
				}
			},
			showMySoldierList :function(){
				for ( var i = 0 , j = 0 ; i < mySoldierList.length ; i ++ ){
					if ( mySoldierList[i].isPicked === false ){
						preStage.pickSoldier.showMySoldierBack(j) ;
						preStage.pickSoldier.showMySoldierInfo(j,i) ;
						j ++ ;
					}
				}
			},
			showAll: function(){

				common.setMouseEvent(preStage.pickSoldier.mouseOver,preStage.pickSoldier.mouseClick);

				gameCtx.drawImage(canvasMap['choose_soldier'],canvasWidth/2-canvasMap['choose_soldier'].width/2,canvasHeight/2-canvasMap['choose_soldier'].height/2);
				preStage.pickSoldier.showMySoldierList();
				for ( var i = 0 ; i < mySoldierList.length ; i ++ ){
					if ( mouseOver === 'pickSoldier' + i ) {
						gameCtx.fillText(roleList[mySoldierList[i].id],100,650);
						gameCtx.fillText(roleDescriptionList[mySoldierList[i].id],100,700);
						break ; 
					}
				}

				preStage.pickSoldier.showCloseButton();
			}
		}
	};

	var stage = {
		isShowChooseSoldier : false ,
		isInitInvoke : false ,
		nowPickInvoke : null ,
		background : {} ,
		monsterAllList : [] ,
		gameOver : {} ,
		win : {} ,
		isGameWin : false ,
		isGameOver : false ,
		exp : 0 ,
		expTotal : 0 ,
		addMonsterTimer : 0 ,
		initExp : function(exp){
			stage.exp = exp ;
			stage.expTotal = exp ;
		},
		showAnimation : function(){
			for ( var i = 0 ; i < animationList.length ; i ++ ){
				var dx = animationList[i].dx || 0 , dy = animationList[i].dy || 0 ;
				gameCtx.drawImage(animationList[i].canvas,animationList[i].nowFrame*animationList[i].width,0,animationList[i].width,animationList[i].height,animationList[i].x+dx,animationList[i].y+dy,animationList[i].width,animationList[i].height);
				animationList[i].x += dx , animationList[i].y += dy ;
				if ( animationList[i].timer < animationList[i].delay  ){
					animationList[i].timer ++ ;
				} else if ( animationList[i].timer >= animationList[i].delay  ){
					animationList[i].nowFrame  ++ ;
					animationList[i].timer = 0 ;
					if ( animationList[i].nowFrame >= animationList[i].totalFrame ){
						animationList.splice(i, 1);
						i -- ;
					}
				}
			}
		},
		showLevelUp : function(index){
			for ( var i = 0 ; i < preStage.invokeList.length ; i ++ ) {
				if ( preStage.invokeList[i].soldier.id !== -1 ){
					if ( preStage.invokeList[i].isLevelUp === true ){
						gameCtx.fillText("Level Up !!",preStage.invokeList[i].x,preStage.invokeList[i].y-25) ;	
					}
				}
			}	
		},
		setLevelUp : function(index){
			var temp = preStage.invokeList[index].soldier.goalExp - preStage.invokeList[index].soldier.nowExp ;
			preStage.invokeList[index].isLevelUp = true ;
			preStage.invokeList[index].soldier.nowExp = 0 ;
			preStage.invokeList[index].soldier.level ++ ;
			preStage.invokeList[index].soldier.goalExp = 10*(0.5+preStage.invokeList[index].soldier.level/2) ;
		},
		showAddExp : function(){
			for ( var i = 0 ; i < preStage.invokeList.length ; i ++ ) {
				if ( preStage.invokeList[i].soldier.id !== -1 ){
					var exp = Math.floor( preStage.invokeList[i].soldier.nowExp );
					gameCtx.fillText(exp+'/'+preStage.invokeList[i].soldier.goalExp,preStage.invokeList[i].x,preStage.invokeList[i].y) ;
				}
			}
			if ( stage.exp <= 0 ){
				return ;
			} else {
				var e = stage.expTotal / 100 ;
				for ( var i = 0 ; i < preStage.invokeList.length ; i ++ ) {
					if ( preStage.invokeList[i].soldier.id !== -1 ){
						preStage.invokeList[i].soldier.nowExp += e ;
						if ( preStage.invokeList[i].soldier.nowExp >= preStage.invokeList[i].soldier.goalExp ){
							stage.setLevelUp(i);
						}
					}
				}
				stage.exp -= e ;
			}
		},
		addMonster : function(){
			if ( stage.isGameWin === true || stage.isGameOver === true )
				return ;
			if( stage.addMonsterTimer > 0){
				stage.addMonsterTimer -- ;
				return ; 
			} else if ( stage.monsterAllList.length !== 0 ) {
				monsterList.push(stage.monsterAllList.shift());
				stage.addMonsterTimer = 200 ;
			} else {
				return ;
			}
		},
		showMonster : function(){
			for ( var i = 0 ; i < monsterList.length ; i ++ ){
				if ( monsterList[i].nowHp <= 0 ){
					monsterList[i].isDie() ;
					monsterList[i].showAll();
					if ( monsterList.length === 0 && stage.monsterAllList.length === 0 ){
						stage.isGameWin = true ;
					}
				} else {
					if ( monsterList.length === 0 && stage.monsterAllList.length === 0 ){
						stage.isGameWin = true ;
					}
					monsterList[i].isMove();
					monsterList[i].showAll();
				}
			}
		},
		soldierEvent : function(){
			for ( var i = 0 ; i < preStage.invokeList.length ; i ++ ){
				if ( preStage.invokeList[i].soldier.id !== -1 ){
					preStage.invokeList[i].soldier.isAttack(preStage.invokeList[i].x,preStage.invokeList[i].y);
				}
			}
		},
		toGameOver : function(){
			gameCtx.drawImage(canvasMap['gameover'],stage.gameOver.x,stage.gameOver.y);
		},
		toGameWin : function(){
			gameCtx.drawImage(canvasMap['win'],stage.win.x,stage.win.y);
			stage.showAddExp();
		},
		detectGame : function(){
			if ( stage.isGameOver === true ){
				stage.toGameOver();
			} else if ( stage.isGameWin === true ){
				stage.toGameWin();
			}
		},
		initGameOver : function(){
			stage.gameOver = { x: 300 , y : 300 , w : canvasMap['gameover'].width , h:canvasMap['gameover'].height} ;
		},
		initWin : function(){
			stage.win = { x: 300 , y : 300 , w : canvasMap['win'].width , h:canvasMap['win'].height} ;
		},
		init : function(){
			stage.initGameOver();
			stage.initWin();
		},
		stage1 : {
			initMonsterList : function(){
				for ( var i = 0 ; i < 10 ; i ++ ){
					stage.monsterAllList.push(common.clone(monsterMap['snail']));
				}
			},
			init : function(){
				stage.init();
				stage.initExp(10);
				stage.stage1.initMonsterList();
			},
			showAll : function(){
				common.setMouseEvent(preStage.mouseOver,preStage.mouseClick);
				stage.addMonster();
				preStage.showBackground();
				preStage.showDescription();
				preStage.showInvoke();
				stage.showMonster();
				if ( preStage.isPickSoldier !== null ) {
					preStage.showSoldierDetail();
				}
				if ( mouseOver.match('soldier') !== null  )  {
					preStage.showDescription();
					preStage.showSoldierOver();
				} 
				preStage.showSoldierRange();
				stage.soldierEvent();
				stage.detectGame();
				stage.showLevelUp();
				stage.showAnimation();
			}
		}
	}
	
	window.onload = common.init();
})();

window.addEventListener("load", function() {
    FastClick.attach(document.body)
}, !1);
