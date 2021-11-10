var HD, Runner;

(() => {
  var init = () => {
    const flat = 'non-flat-earth'
    const href = './fake.html?'
    const getQueryParams = _ => window.location.search.replace('?', '').split('&')
    const getMode = _ => getQueryParams().filter(q => q != flat)
    const setHref = config => window.location.href = href + config.join('&')
    const hasFlat = _ => window.location.search.indexOf(flat) >= 0
    const ChangeGame = nextMode => {
      const mode = [nextMode]
      hasFlat() ? mode.push(flat) : null
      setHref(mode)
    }
    const ChangeFlat = _ => {
      const mode = getMode()
      hasFlat() ? null : mode.push(flat)
      setHref(mode)
    }
    window.ChangeGame = ChangeGame
    window.ChangeFlat = ChangeFlat
    
    var HY_DINO = function() {
      this.Ready = false;
      this.Mode = getMode().pop();
      this.Flat = !hasFlat();
      this.IS_AUTOMATO = false;
      this.fakeKey = {
        preventDefault : function(){},
        target  : null,
        type    : null,
        keyCode : null
      };
      this.Time = {
        Id       : null,
        CallBack : null
      };
      this.Pos = {
        Jump : null,
        Duck : null
      };
      this.Sprites = {
        ''               : 'offline-resources-normal',
        'velociraptor'   : 'offline-resources-velociraptor',
        'automatosaurus' : 'offline-resources-automatosaurus'
      };
      this.Runner = function(){};
      this.Out = {
        Canvas : null,
        Game   : null,
        tRex   : null
      };
    };

    HY_DINO.prototype.getSprite = function(){
      return this.Sprites[this.Mode];
    };

    HY_DINO.prototype.createRunning = function(Func){
      return function(){
        if (this.Mode == 'velociraptor' && (!this.Out.tRex.ducking || this.Out.tRex.status != 'DUCKING'))
          this.Out.tRex.setDuck(true);
        if (this.Out.Game.paused)
          this.Out.Game.play();
        var Obstacles = this.Out.Game.horizon.obstacles;
        for(var i=0; i<Obstacles.length; i++){
          if (Func(Obstacles[i]))
            return;
        }
      }
    };

    HY_DINO.prototype.RUN = function(Item){
      if (Item.processed == undefined){
        Item.processed = true;
        Item.collisionBoxes = [];
        return true;
      }
      return false;
    };

    HY_DINO.prototype.AUTO = function(Item){
      if (Item.processed === undefined){
        if (73 < Item.yPos && Item.yPos <= 75) { // high hit
          if (Item.xPos <= this.Pos.Duck)
            if (this.TryDuck())
              Item.processed = true;
        } else if (Item.yPos > 75) {
          /*// console.log((this.tRexWidth +Item.width +this.Pos.Jump) /2, Item.xPos, (this.tRexWidth +Item.width +this.Pos.Jump) /2 >= Item.xPos)
          if ((this.tRexWidth +Item.width +this.Pos.Jump) /2 >= Item.xPos)
            if (this.TryJump())
                Item.processed = true;*/
          var dif = Item.width <= 25 ? 0 : 10;
          if (Item.xPos +dif <= this.Pos.Jump) // low hit (pitero hit in y=75px)
            if (this.TryJump())
              Item.processed = true;
        }
        return Item.processed === true;
      }
      return false;
    };

    HY_DINO.prototype.pressKey = function(keyCode, Time = 250){
      if (this.Time.CallBack !== null){
        clearTimeout(this.Time.Id);
        this.Time.CallBack();
      }
      var e = this.fakeKey;
      e.keyCode = keyCode;
      this.Out.Game.onKeyDown(e);
      this.upKey(e, Time);
    };

    HY_DINO.prototype.upKey = function(EventKey, Time = 250){
      this.Time.CallBack = function(){ this.Out.Game.onKeyUp(EventKey) }.bind(this);
      this.Time.Id = setTimeout(function(){
        this.Time.CallBack();
        this.Time.CallBack = null;
      }.bind(this), Time);
    };

    HY_DINO.prototype.TryJump = function(){
      if (!this.Out.tRex.jumping){
        this.pressKey('38', 100);
        if (this.Mode === 'automatosaurus') {
          try {
            window.aquidauana.touch();
          } catch (e) {}
        }
        return true;
      }
      return false;
    };

    HY_DINO.prototype.TryDuck = function(){
      if (/*!this.Out.tRex.jumping &&*/ !this.Out.tRex.ducking){
        this.pressKey('40');
        return true;
      }
      return false;
    };

    HY_DINO.prototype.setGameMode = function(){
      switch(this.Mode) {
        case 'velociraptor':
          this.Out.Game.horizon.config['CLOUD_FREQUENCY'] = 1;
          this.Out.Game.horizon.config['BG_CLOUD_SPEED'] = 1;
          this.Out.Game.horizon.config['MAX_CLOUDS'] = 10;
          this.Out.Game.setSpeed( this.Out.Game.config['MAX_SPEED'] = this.Out.Game.config['SPEED'] = 100);
          var Func = this.RUN.bind(this);
          break;

        case 'automatosaurus':
          this.Out.Game.config['CLOUD_FREQUENCY'] = 0.7;
          this.Out.Game.config['GRAVITY'] = 0.7;
          this.Out.Game.config['INITIAL_JUMP_VELOCITY'] = 13;
          this.Out.Game.config['INVERT_FADE_DURATION'] = 7000;
          this.Out.Game.config['MAX_CLOUDS'] = 10;
          this.Out.Game.config['MAX_OBSTACLE_LENGTH'] = 4;
          this.Out.Game.config['MIN_JUMP_HEIGHT'] = 40;
          this.Out.Game.config['CLEAR_TIME'] = 1000;
          this.Out.Game.config['ACCELERATION'] = 0.0035;
          this.Out.Game.config['MAX_SPEED'] = window.innerWidth > 555 ? 18 : 10;
          var Func = this.AUTO.bind(this);
          break;
        
        default:
          if (this.Flat) {
            this.Out.Game.config['MAX_SPEED'] = 1
          }
      }

      this.IS_AUTOMATO = true;
      this.play();
      this.tRexWidth = this.Out.Game.tRex.config.WIDTH;

      return Func;
    };

    HY_DINO.prototype.play = function(){
      if (this.Out.Game.paused)
        this.Out.Game.play();
      this.Out.Game.startGame();
      this.Out.Game.playIntro();
      this.Out.Game.play();
    }

    HY_DINO.prototype.setJumpLength = function(){
      if (this.Out.Canvas != undefined){
        if (this.Mode === 'automatosaurus' && this.Out.Game.crashed) {
          setTimeout(
            ()=>this.Out.Game.restart(),
            3000);
        }
        var Speed = 1 +Math.pow(this.Out.Game.currentSpeed /20, 2);
        var cof = window.innerWidth > 555 ? 1 : 0.75;
        this.Pos.Jump = parseInt(110 *Speed *cof);
        this.Pos.Duck = parseInt(60  *Speed *cof);
        this.Runner();
        // console.log(this.Out.Game.currentSpeed, Speed, cof, this.Pos.Jump);
      }
    };

    HY_DINO.prototype.start = function(){
      setTimeout(
        () => {
          try {
            window.aquidauana.clear();
            if (this.Mode === 'automatosaurus') {
              window.aquidauana('/guitarra.mp3', []);
              console.log('sing aquidauana')
            }
          } catch (e) {}
        }
      , 10 * 1000)

      this.Ready = true
      this.Out.Canvas = document.getElementsByClassName('runner-canvas')[0];
      this.Out.Game = Runner.call();
      this.Out.tRex = this.Out.Game.tRex;
      this.setJumpLength();
      var Func = function(){};
      if (this.Mode != '')
        var Func = this.setGameMode().bind(this);
      this.Runner = this.createRunning(Func); //setInterval( this.createRunning(Func).bind(this), 1);

      console.log('Run lola!');
      if (!this.Mode)
        this.play();
    };

    HY_DINO.prototype.distort = function(xPos, yPos){
      let x = xPos
      let y = yPos
      if (this.Ready && !this.Flat) {
        const relative = x / this.Out.Canvas.width
        const modifier = (relative - Math.pow(relative, 2)) * 199
        const t = y - modifier
        y = t
      }
      return [x, y]
    }
    
    HY_DINO.prototype.canvasInterceptor = function(canvas){
      const canvasCtx = canvas.getContext('2d')
      canvasCtx.distortedDrawImage = function(image, sx, sy, sw, sh, dx, dy, dw, dh){
        const [newX, newY] = HD.distort(dx, dy)
        canvasCtx.drawImage(image, sx, sy, sw, sh, newX, newY, dw, dh)
      }
      return canvasCtx
    }

    HD = new HY_DINO();
    setTimeout(() => HD.start(), 1000)
  }

  var load = () => setTimeout(() => {
    // var errorCode = document.getElementsByClassName('error-code')[0]
    // errorCode.innerHTML = errorCode.innerHTML+'_'+window.innerWidth;
    init();
  });

  document.readyState !== 'complete'
    ? document.addEventListener('DOMContentLoaded', load)
    : load();
})()
