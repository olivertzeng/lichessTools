(()=>{
  class MoveAssistantTool extends LiChessTools.Tools.ToolBase {

    dependencies=['EmitRedraw','Stockfish'];

    preferences=[
      {
        name:'moveAssistant',
        category: 'analysis',
        type:'single',
        possibleValues: [false,true],
        defaultValue: true,
        advanced: true
      }
    ];

    intl={
      'en-US':{
        'options.analysis': 'Analysis',
        'options.moveAssistant': 'Move assistant',
        'assistantButtonTitle': 'LiChess Tools - selected piece move evaluation'
      },
      'ro-RO':{
        'options.analysis': 'Analiz\u0103',
        'options.moveAssistant': 'Asistent mut\u0103ri',
        'assistantButtonTitle': 'LiChess Tools - evaluarea mut\u0103rilor piesei selectate'
      }
    }

    evaluate=async ()=>{
      const parent=this.lichessTools;
      const lichess=parent.lichess;
      const $=parent.$;
      const analysis=lichess?.analysis;
      if (!analysis) return;
      const selected=analysis.chessground?.state?.selected;
      const dests=selected
        ? analysis.chessground?.state?.movable?.dests?.get(selected)
        : null;
      const isInteractive=!!analysis.study?.gamebookPlay;
      const isActive = !!(this.options.enabled
                         && this._isEnabled
                         && selected
                         && dests?.length
                         && !isInteractive
                         && (analysis.turnColor()==analysis.getOrientation()));
      $('main.analyse div.cg-wrap').toggleClass('lichessTools-moveAssistant',isActive);
      $('div.ceval button.lichessTools-moveAssistant').toggleClass('lichessTools-enabled',!!this._isEnabled);
      if (!isActive) {
        if (this._evaluating) {
          this._evaluating=false;
          this._fen=null;
          this.clearSquares();
          this._sf?.stop();
        }
        return;
      }
      if (!this._sf) {
        const sf=await parent.stockfish.load();
        if (!sf) return;
        sf.setHash(64);
        sf.setMultiPv(500);
        sf.setDepth(20);
        sf.on('info',this.getInfo);
        this._sf=sf;
      }
      if (!this._evaluating) {
        this._eval={};
        this._evaluating=true;
        this._fen=analysis.node.fen;
        this._sf.setPosition(this._fen);
        this._sf.start();
      }
      if (this._fen!=analysis.node.fen) {
        this._eval={};
        this._fen=analysis.node.fen;
        this._sf.setPosition(this._fen);
      }
      this.refreshSquares();
    };

    _squares={};
    getSquare=(e,side,isBlack)=>{
      const parent=this.lichessTools;
      const $=parent.$;
      const matrix=$(e).css('transform');
      if (!matrix) return;
      const key=(isBlack?'b':'w')+side+matrix;
      let dest=this._squares[key];
      if (dest) return dest;
      const m=/(?<x>\d+), (?<y>\d+)\)/.exec(matrix);
      if (!m) return;
      const x=+(m.groups.x)*8/side;
      const y=+(m.groups.y)*8/side;
      const rank=isBlack?y:7-y;
      const file=isBlack?7-x:x;
      dest=String.fromCharCode('a'.charCodeAt(0)+file)+(rank+1);
      this._squares[key]=dest;
      return dest;
    }

    refreshSquares=()=>{
      const parent=this.lichessTools;
      const lichess=parent.lichess;
      const $=parent.$;
      const analysis=lichess?.analysis;
      if (!analysis) return;
      const selected=analysis.chessground?.state?.selected;

      let minCp=100000;
      let maxCp=-100000;
      Object.keys(this._eval).forEach(k=>{
        const cp=this._eval[k];
        if (cp>maxCp) maxCp=cp;
        if (cp<minCp) minCp=cp;
      });
      
      const side=$('main.analyse cg-board').width();
      const isBlack=lichess.analysis.getOrientation()=='black';
      $('square.move-dest').each((i,e)=>{
        const dest=this.getSquare(e,side,isBlack);
        const uci=selected+dest;
        const cp=this._eval[uci];
        if (cp===undefined || minCp==maxCp) {
          return;
        }
        const q=(cp-minCp)/(maxCp-minCp);
        let rating=Math.round(255*Math.pow(q,3));
        const color='#'+(255-rating).toString(16).padStart(2,'0')+rating.toString(16).padStart(2,'0')+'00';
        $(e)
          .css('border-color',color);
      });
    }

    _eval={};
    getInfo=(info)=>{
      const mate=+(info.mate?.at(0));
      const cp=mate
        ? Math.sign(mate)*10000-mate
        : +(info.cp?.at(0));
      const uci=info.pv?.at(0);
      if (!uci || !cp) return;
      this._eval[uci]=cp;
    }

    clearSquares=()=>{
      const parent=this.lichessTools;
      const $=parent.$;
      $('main.analyse div.cg-wrap').removeClass('lichessTools-moveAssistant');
    };

    setControls=()=>{
      const parent=this.lichessTools;
      const $=parent.$;
      const trans=parent.translator;
      const button=$('div.ceval button.lichessTools-moveAssistant');
      if (!this.options.enabled) {
        button.remove();
        return;
      }
      if (!button.length) {
        $('<button type="button" class="lichessTools-moveAssistant">')
          .attr('title',trans.noarg('assistantButtonTitle'))
          .attr('data-icon','\uE069')
          .on('click',ev=>{
            ev.preventDefault();
            this._isEnabled=!this._isEnabled;
          })
          .insertBefore('div.ceval button.settings-gear');
      }
    }

    async start() {
      const parent=this.lichessTools;
      const value=parent.currentOptions.getValue('moveAssistant');
      this.logOption('Move assistant', value);
      this.options={ enabled: value };
      const lichess=parent.lichess;
      const $=parent.$;
      const analysis=lichess?.analysis;
      if (!analysis) return;
      this.clearSquares();
      parent.global.clearInterval(this.interval);
      this.setControls();
      lichess.pubsub.off('redraw',this.setControls);
      if (!value) return;
      this.interval=parent.global.setInterval(this.evaluate,1000);
      lichess.pubsub.on('redraw',this.setControls);
    }

  }
  LiChessTools.Tools.MoveAssistant=MoveAssistantTool;
})();
