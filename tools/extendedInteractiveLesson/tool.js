(()=>{
  class ExtendedInteractiveLessonTool extends LiChessTools.Tools.ToolBase {

    dependencies=['EmitRedraw','EmitChapterChange','RandomVariation','DetectThirdParties'];

    preferences=[
      {
        name:'extendedInteractiveLesson',
        category: 'study',
        type:'multiple',
        possibleValues: ['extendedInteractive','showFinalScore','studyLinksSameWindow','returnToPreview'],
        defaultValue: 'extendedInteractive,showFinalScore,studyLinksSameWindow'
      },
      {
        name:'extendedInteractiveLessonFlow',
        category: 'study',
        type:'multiple',
        possibleValues: ['sequential','spacedRepetition'],
        defaultValue: false,
        advanced: true
      }
    ];

    intl={
      'en-US':{
        'options.study': 'Study',
        'options.extendedInteractiveLesson': 'Extended interactive lessons',
        'extendedInteractiveLesson.extendedInteractive':'Play all variations',
        'extendedInteractiveLesson.showFinalScore':'Show score',
        'extendedInteractiveLesson.studyLinksSameWindow':'Study links in comments in same window',
        'extendedInteractiveLesson.returnToPreview':'Play again from where you entered Preview',
        'extendedInteractiveLesson': 'Extended Interactive lesson',
        'extendedInteractiveLessonLong': 'Extended Interactive lesson - LiChess Tools',
        'finalScore': 'Final score: %s%',
        'nextMovesCount': 'Make one of %s accepted moves',
        'nextMovesCount:one': 'Only one accepted move to make',
        'interactiveLessonsText': 'Interactive lessons',
        'addDeviationText':'Explain why other moves are wrong',
        'addDeviationTitle':'LiChess Tools - explain why moves from here not in the PGN are wrong',
        'options.extendedInteractiveLessonFlow': 'Extended interactive lesson flow',
        'extendedInteractiveLessonFlow.sequential': 'Sequential',
        'extendedInteractiveLessonFlow.spacedRepetition': 'Spaced Repetition',
        'resetQuestionNoVariations': 'No more variations. Reset?',
        'resetQuestion': 'Reset variation progress?',
        'resetButtonText': 'Reset',
        'resetButtonTitle': 'LiChess Tools - reset variation progress',
        'progressTitle': 'LiChess Tools - %s variations'
      },
      'ro-RO':{
        'options.study': 'Studiu',
        'options.extendedInteractiveLesson': 'Lec\u0163ii interactive extinse',
        'extendedInteractiveLesson.extendedInteractive':'Joac\u0103 toate varia\u0163iunile',
        'extendedInteractiveLesson.showFinalScore':'Arat\u0103 scorul',
        'extendedInteractiveLesson.studyLinksSameWindow':'Linkuri c\u0103tre studii \u00een aceea\u015Fi fereastr\u0103',
        'extendedInteractiveLesson.returnToPreview':'Joac\u0103 din nou de unde ai intrat \u00een Preview',
        'extendedInteractiveLesson': 'Lec\u0163ie Interactiv\u0103 extins\u0103',
        'extendedInteractiveLessonLong': 'Lec\u0163ie Interactiv\u0103 extins\u0103 - LiChess Tools',
        'finalScore': 'Scor final: %s%',
        'nextMovesCount': 'F\u0103 una din %s mut\u0103ri acceptate',
        'nextMovesCount:one': 'O singur\u0103 mutare de f\u0103cut',
        'interactiveLessonsText': 'Lec\u0163ii interactive',
        'addDeviationText':'Explic\u0103 de ce alte mut\u0103ri sunt gre\u015Fite',
        'addDeviationTitle':'LiChess Tools - explic\u0103 de ce mut\u0103ri de aici lips\u0103 din PGN sunt gre\u015Fite',
        'options.extendedInteractiveLessonFlow': 'Cursul lec\u0163iilor interactive extinse',
        'extendedInteractiveLessonFlow.sequential': 'Secven\u0163ial',
        'extendedInteractiveLessonFlow.spacedRepetition': 'Repeti\u0163ie distan\u0163at\u0103',
        'resetQuestionNoVariations': 'Nu mai sunt varia\u0163uni. Resetez?',
        'resetQuestion': 'Resetez progresul \u00een varia\u0163uni?',
        'resetButtonText': 'Resetare',
        'resetButtonTitle': 'LiChess Tools - resetare progres \u00een varia\u0163uni',
        'progressTitle': 'LiChess Tools - %s varia\u0163uni'
      }
    }

    extendedGamebook={
      goodMoves:0,
      badMoves:0,
      makeState:()=>{
        const parent=this.lichessTools;
        const analysis=parent.lichess.analysis;
        const $=parent.$;
        const trans=parent.translator;
        const gp=analysis.gamebookPlay();
        const node = analysis.node;
        if (!node.gamebook && !analysis.tree.root.gamebook) {
          // weird behavior after finishing a lesson and switching to analysis and back
          this.addGameBookToAllNodes();
        }
        const nodeComment = (node.comments || [])[0];
        const state = {
            init: analysis.path === '',
            comment: nodeComment?.text,
            showHint: false
        };
        if (state.init) {
          if (this.options.flow.sequential || this.options.flow.spacedRepetition) {
            gp.currentPath=this.getCurrentPath();
            if (!gp.currentPath) {
              const nextMoves=parent.getNextMoves(node,gp.threeFoldRepetition)
                                    .filter(c=>c.gamebook);
              if (nextMoves.length && parent.global.confirm(trans.noarg('resetQuestionNoVariations'))) {
                this.resetDone();
                return gp.makeState();
              }
            }
          }
        }
        const parPath = analysis.path.slice(0,-2);
        const parNode = analysis.tree.nodeAtPath(parPath);
        const isAcceptedMove = !!node.gamebook && (!(this.options.flow.sequential || this.options.flow.spacedRepetition) || this.inCurrentPath(analysis.path));
        if (!isAcceptedMove) {
          const position=parent.getNodePosition(node);
          const candidate=parent.getNextMoves(parNode,gp.threeFoldRepetition)
                                .filter(c=>c.gamebook)
                                .filter(c=>!(this.options.flow.sequential || this.options.flow.spacedRepetition) || this.inCurrentPath(c.path))
                                .find(c=>parent.getNodePosition(c)==position);
          if (candidate) {
            if (candidate.path!==undefined) {
              analysis.userJump(candidate.path);
              return this.extendedGamebook.makeState();
            } else {
              parent.global.console.warn('Node has no path',candidate);
            }
          }
        }
        const nextMoves=parent.getNextMoves(node,gp.threeFoldRepetition)
                                     .filter(c=>c.gamebook)
                                     .filter(c=>!(this.options.flow.sequential || this.options.flow.spacedRepetition) || this.inCurrentPath(c.path));
        if (!isAcceptedMove) {
          state.feedback = 'bad';
          if (!state.comment) {
            state.comment = parNode.children[0].gamebook?.deviation;
          }
        } else if (!nextMoves.length) {
          state.feedback = 'end';
          this.markPathFinished(analysis.path,gp.goodMoves,gp.badMoves,gp.askedForSolution);
        } else if (gp.isMyMove()) {
          state.feedback = 'play';
          state.hint = node.gamebook?.hint;
          if (!state.hint) {
            const nextMovesCount=new Set(nextMoves.map(c=>c.uci)).size;
            const hint=trans.pluralSame('nextMovesCount',nextMovesCount);
            state.hint=hint;
          }
        } else {
          state.feedback = 'good';
        }
        gp.state = state;
        if (!state.comment) {
          if (state.feedback === 'good') {
            parent.global.setTimeout(gp.next, analysis.path ? 1000 : 300);
          }
          else if (state.feedback === 'bad') {
            parent.global.setTimeout(gp.retry, 800);
          }
        }
      },
      retry: ()=>{
        const parent=this.lichessTools;
        const analysis=parent.lichess.analysis;
        const gp=analysis.gamebookPlay();
        if (analysis.path==='') {
          gp.makeState();
        } else {
          const parPath = analysis.path.slice(0,-2);
          const count=+gp.fens[analysis.node.fen]||0;
          if (count==3) {
            gp.threeFoldRepetition=false;
          }
          gp.fens[analysis.node.fen]=Math.max(0,count-1);
          analysis.userJump(parPath);
        }
    	gp.redraw();
      },
      next: ()=>{
        const parent=this.lichessTools;
        const analysis=parent.lichess.analysis;
        const gp=analysis.gamebookPlay();
        if (!gp) return;
        if (!gp.isMyMove()) {
          let child=null;
          if (this.options.flow.sequential || this.options.flow.spacedRepetition) {
            const childPath=gp.currentPath.slice(0,analysis.path.length+2);
            if (childPath.length==analysis.path.length+2) child=analysis.tree.nodeAtPath(childPath);
          } else {
            child=parent.getRandomVariation(analysis.node,gp.threeFoldRepetition);
          }
          if (child) {
            analysis.userJump(child.path||(analysis.path+child.id));
            const count=(+gp.fens[analysis.node.fen]||0)+1;
            gp.fens[analysis.node.fen]=count;
            if (count>=3) {
              gp.threeFoldRepetition=true;
            }
          }
        } 
        gp.redraw();
      },
      solution: ()=>{
        const parent=this.lichessTools;
        const analysis=parent.lichess.analysis;
        const gp=analysis.gamebookPlay();
        let children=parent.getNextMoves(analysis.node,gp.threeFoldRepetition).filter(c=>c.gamebook);
        if (this.options.flow.sequential || this.options.flow.spacedRepetition) {
          children=children.filter(c=>this.inCurrentPath(c.path));
        }
        if (!children) return;
        const shapes=[];
        for (const child of children) {
          shapes.push({
            orig:child.uci.slice(0,2),
            dest:child.uci.slice(2,4),
            brush:'green'
          });
          if (child.promotion) {
            shapes.push({
              orig:child.uci.slice(2,4),
              piece: {
                color:analysis.turnColor(),
                role:child.promotion,
                scale: 0.8
              },
              brush: 'green'
            });
          }
        }
        analysis.chessground.setShapes(shapes);
      },
      resetStats: function() {
        const gp=this;
        gp.goodMoves=0;
        gp.badMoves=0;
        gp.threeFoldRepetition=false;
        gp.fens={};
      }
    };

    getCurrentPath=()=>{
      const parent=this.lichessTools;
      const lichess=parent.lichess;
      const analysis=lichess.analysis;
      const gp=analysis.gamebookPlay();
      if (!gp) return;
      if (!this._paths) {
        const json=lichess.storage.get('LichessTools.chapterPaths');
        this._paths=parent.jsonParse(json,{});
      }
      const key=analysis.study.data.id+'/'+analysis.study.currentChapter()?.id;
      let paths=this._paths[key];
      if (!paths) {
        paths={};
        this._paths[key]=paths;
      }
      if (paths.currentPath && !this.isDonePath(paths.currentPath)) return paths.currentPath;
      let currentPaths=[];
      let traverse=null;
      if (this.options.flow.sequential) {
        traverse=(node)=>{
          if (currentPaths.length) return;
          const nextMoves=node.children
                                .filter(c=>c.gamebook);
          if (!nextMoves.length && !this.isDonePath(node.path)) {
            currentPaths.push(node.path);
          }
          for (const child of nextMoves) traverse(child);
        };
      } else 
      if (this.options.flow.spacedRepetition) {
        traverse=(node)=>{
          const nextMoves=node.children
                                .filter(c=>c.gamebook);
          if (!nextMoves.length && !this.isDonePath(node.path)) {
            currentPaths.push(node.path);
          }
          for (const child of nextMoves) traverse(child);
        };
      }
      traverse(analysis.tree.root);
      const i = Math.floor(Math.random() * currentPaths.length);
      paths.currentPath=currentPaths[i];
      lichess.storage.set('LichessTools.chapterPaths',JSON.stringify(this._paths));
      return paths.currentPath;
    };

    inCurrentPath=(path)=>{
      const parent=this.lichessTools;
      const analysis=parent.lichess.analysis;
      const gp=analysis.gamebookPlay();
      if (!gp) return;
      return gp.currentPath?.startsWith(path);
    };

    markPathFinished=(path,goodMoves,badMoves,askedForSolution)=>{
      const parent=this.lichessTools;
      const lichess=parent.lichess;
      const analysis=lichess.analysis;
      const gp=analysis.gamebookPlay();
      if (!gp) return;
      const key=analysis.study.data.id+'/'+analysis.study.currentChapter()?.id;
      if (!this._paths) {
        const json=lichess.storage.get('LichessTools.chapterPaths');
        this._paths=parent.jsonParse(json,{});
      }
      const paths=this._paths[key] || {};
      const success = badMoves==0 && !askedForSolution && goodMoves>=Math.floor(path.length/4);
      const item=paths[path] || { path, interval:1 };
      item.time=Date.now();
      item.success=success;
      if (!item.interval) item.interval=1;
      if (success) {
        item.interval=2;
      } else {
        item.interval/=2;
      }
      paths[path]=item;

      const traverse=(node)=>{
        const nextMoves=node.children
                              .filter(c=>c.gamebook);
        if (!nextMoves.length) {
          if (!paths[node.path]) {
            paths[node.path]={ path:node.path, interval:0, time:Date.now(), success: false };
          }
        }
        for (const child of nextMoves) traverse(child);
      };
      traverse(analysis.tree.root);

      this._paths[key]=paths;
      lichess.storage.set('LichessTools.chapterPaths',JSON.stringify(this._paths));
      this.refreshChapterProgress();
    };

    isDonePath=(path)=>{
      const parent=this.lichessTools;
      const lichess=parent.lichess;
      if (!this._paths) {
        const json=lichess.storage.get('LichessTools.chapterPaths');
        this._paths=parent.jsonParse(json,null);
      }
      if (!this._paths) return false;
      const analysis=lichess.analysis;
      const key=analysis.study.data.id+'/'+analysis.study.currentChapter()?.id;
      const paths=this._paths[key];
      if (!paths) return;
      const item=paths[path];
      if (this.options.flow.spacedRepetition) {
        return item && Date.now()<item.time+item.interval*86400000;
      } else {
        return item?.success;
      }
    };

    resetDone=()=>{
      const parent=this.lichessTools;
      const lichess=parent.lichess;
      if (!this._paths) {
        const json=lichess.storage.get('LichessTools.chapterPaths');
        this._paths=parent.jsonParse(json,null);
      }
      if (!this._paths) return false;
      const analysis=parent.lichess.analysis;
      const key=analysis.study.data.id+'/'+analysis.study.currentChapter()?.id;
      this._paths[key]=null;
      lichess.storage.set('LichessTools.chapterPaths',JSON.stringify(this._paths));
      this.refreshChapterProgress();
    };

    showScore=()=>{
      const parent=this.lichessTools;
      const Math=parent.global.Math;
      const analysis=parent.lichess.analysis;
      const trans=parent.translator;
      const gp=analysis.gamebookPlay();
      if (!this.options.showFinalScore) return;
      gp.goodMoves=+(gp.goodMoves)||0;
      gp.badMoves=+(gp.badMoves)||0;
      if (gp.goodMoves+gp.badMoves==0) return;
      const score = gp.goodMoves/(gp.goodMoves+gp.badMoves);
      const finalScoreText = trans.pluralSame('finalScore',Math.round(100*score));
      const scoreRating=score>0.90?4:score>0.75?3:score>0.50?2:1;
      const el=$('<span/>')
        .addClass('lichessTools-score')
        .addClass('lichessTools-score'+scoreRating)
        .text(finalScoreText)
        .attr('title',gp.goodMoves+'/'+gp.badMoves);
      parent.global.setTimeout(()=>$('div.gamebook .comment .content').append(el),100);
      gp.resetStats();
    };

    replaceFunction=(func,newFunc,id)=>{
      const parent=this.lichessTools;
      return parent.wrapFunction(func,{
        id: id,
        before: ()=>false,
        after:($this,result,...args)=>{
          return newFunc(...args);
        }
      });
    };

    originalUserJump=null;
    patchGamebook=()=>{
      const parent=this.lichessTools;
      const analysis=parent.lichess.analysis;
      if (analysis.study?.practice) return;
      const gp=analysis.gamebookPlay();
      if (!gp) return;
      if (this.options.extendedInteractive && !gp.isExtendedInteractiveLessons) {
        gp.makeState=this.replaceFunction(gp.makeState,this.extendedGamebook.makeState,'extendedInteractiveLessons');
        gp.retry=this.replaceFunction(gp.retry,this.extendedGamebook.retry,'extendedInteractiveLessons');
        gp.next=this.replaceFunction(gp.next,this.extendedGamebook.next,'extendedInteractiveLessons');
        gp.solution=this.replaceFunction(gp.solution,this.extendedGamebook.solution,'extendedInteractiveLessons');
        gp.isExtendedInteractiveLessons=true;
        gp.fens={};
        gp.resetStats=this.extendedGamebook.resetStats;
        // stop the original setTimeout gp.next()
        if (!this.originalUserJump) this.originalUserJump=analysis.userJump; 
        if (analysis.node.id==='') {
          analysis.userJump=function() {};
          parent.global.setTimeout(()=>{
            analysis.userJump=this.originalUserJump;
            if (!gp.state.comment) gp.next();
          },analysis.path==''?1100:400);
        }
      } else if (!this.options.extendedInteractive && gp.isExtendedInteractiveLessons) {
        gp.makeState=parent.unwrapFunction(gp.makeState,'extendedInteractiveLessons');
        gp.retry=parent.unwrapFunction(gp.retry,'extendedInteractiveLessons');
        gp.next=parent.unwrapFunction(gp.next,'extendedInteractiveLessons');
        gp.solution=parent.unwrapFunction(gp.solution,'extendedInteractiveLessons');
        gp.isExtendedInteractiveLessons=true;
      }
      if (this.options.showFinalScore && !gp.isShowScore) {
        gp.fens={};
        gp.resetStats=this.extendedGamebook.resetStats;
        gp.makeState=parent.wrapFunction(gp.makeState,{
          id:'showScore',
          after: ($this, result, ...args)=>{
            // fix lichess bug where entering Preview mode keeps using Explorer endpoints in the background
            if (this.explorerEnabled===undefined) {
              this.explorerEnabled=analysis.explorer.enabled();
            }
            if (this.explorerEnabled) {
              analysis.explorer.enabled(false);
            }
            gp.goodMoves=+(gp.goodMoves)||0;
            gp.badMoves=+(gp.badMoves)||0;
            const state=$this.state;
            switch(state.feedback) {
              case 'good':
                if (gp.askedForSolution) {
                  gp.badMoves++;
                } else {
                  gp.goodMoves++;
                }
              break;
              case 'bad':
                gp.badMoves++;
              break;
              case 'end':
                if (gp.askedForSolution) {
                  gp.badMoves++;
                } else {
                  gp.goodMoves++;
                }
              this.showScore();
            break;
          }
          gp.askedForSolution=false;
          }
        });
        gp.next=parent.wrapFunction(gp.next,{
          id:'showScore',
          before: ($this, ...args)=>{
            if (gp.root.node.id=='') {
              gp.resetStats();
            }
          }
        });
        gp.retry=parent.wrapFunction(gp.retry,{
          id:'showScore',
          after: ($this, result, ...args)=>{
            if (gp.root.node.id=='') {
              gp.resetStats();
            }
          }
        });
        gp.solution=parent.wrapFunction(gp.solution,{
          id:'showScore',
          after: ($this, result, ...args)=>{
            gp.askedForSolution=true;
          }
        });
        gp.isShowScore=true;
      } else if (!this.options.showFinalScore && gp.isShowScore) {
        gp.makeState=parent.unwrapFunction(gp.makeState,'showScore');
        gp.next=parent.unwrapFunction(gp.next,'showScore');
        gp.retry=parent.unwrapFunction(gp.retry,'showScore');
        gp.solution=parent.unwrapFunction(gp.solution,'showScore');
        gp.isShowScore=false;
      }
    };

    addDeviation=()=>{
      const parent=this.lichessTools;
      const trans=parent.translator;
      const analysis=parent.lichess.analysis;
      const nodePath=analysis.contextMenuPath;
      const node=analysis.tree.nodeAtPath(nodePath);
      let gamebook=node.gamebook;
      if (!gamebook) {
        gamebook={};
        node.gamebook=gamebook;
      }
      const text=trans.noarg('addDeviationText');
      const deviation = parent.global.prompt(text,gamebook.deviation);
      if (!deviation) return;
      gamebook.deviation=deviation;
      const chapterId=analysis.study.currentChapter()?.id;
      if (!chapterId) {
        parent.global.console.warn('Could not determine chapterId');
        return;
      }
      analysis.study.makeChange('setGamebook',{
        ch: chapterId,
        path: nodePath,
        gamebook: gamebook
      });
      if (analysis.node===node) {
        $('div.gamebook-edit div.deviation textarea').val(deviation);
      }
    };

    playAgain=()=>{
      const parent=this.lichessTools;
      const analysis=parent.lichess.analysis;
      analysis.userJump(this.options.returnToPreview && this._previewPath || '');
      analysis.redraw();
    };

    collapseGamebookEdit=(ev)=>{
      ev.preventDefault();
      const parent=this.lichessTools;
      const $=parent.$;
      const gamebookEdit=$('div.gamebook-edit');
      this._collapsed=!this._collapsed;
      gamebookEdit.toggleClass('lichessTools-collapsed',this._collapsed);
    };

    alterUI=()=>{
      const parent=this.lichessTools;
      const $=parent.$;
      const trans=parent.translator;
      const analysis=parent.lichess.analysis;

      $('body').toggleClass('lichessTools-extendedInteractiveLesson',this.options.extendedInteractive && !!analysis?.study?.data?.chapter?.gamebook);
      //let translation=trans.noarg('extendedInteractiveLesson');
      //$('.gamebook-buttons').attr('data-label',translation);
      let translation=trans.noarg('extendedInteractiveLessonLong')
      $('button.preview').attr('title',translation); //.attr('data-label',translation);

      if (this.options.returnToPreview) {
        $('button.retry, button.fbt.text.back').each((i,e)=>{
          let handlers=parent.getEventHandlers(e,'click');
          if (handlers.filter(h=>h!=this.playAgain).length) {
            parent.removeEventHandlers(e,'click');
            handlers=[];
          }
          if (!handlers.filter(h=>h!=this.playAgain).length) {
            $(e).on('click',this.playAgain);
          }
        });
      }

      const gamebookEdit=$('div.gamebook-edit');
      const header=$('.lichessTools-gamebookHeader',gamebookEdit);
      if (!this.options.extendedInteractive) {
        gamebookEdit.removeClass('lichessTools-collapsed');
        header.remove();
        return;
      }
      gamebookEdit.toggleClass('lichessTools-collapsed',!!this._collapsed);

      if (!header.length) {
        $('<div class="lichessTools-gamebookHeader">')
          .text(trans.noarg('extendedInteractiveLesson'))
          .attr('title',trans.noarg('extendedInteractiveLessonLong'))
          .on('click',this.collapseGamebookEdit)
          .prependTo(gamebookEdit);
      }

      const menu=$('#analyse-cm');
      if (!menu.length) return;
      if (!analysis?.study?.data?.chapter?.gamebook) return;
      if (menu.has('a[data-role="addDeviation"]').length) return;
      const text=trans.noarg('addDeviationText');
      const title=trans.noarg('addDeviationTitle');
      $('<a>')
        .attr('data-icon','\uE05E')
        .attr('data-role','addDeviation')
        .text(text).attr('title',title)
        .on('click',this.addDeviation)
        .appendTo(menu);

    };

    addGameBookToAllNodes=(node)=>{
      const parent=this.lichessTools;
      const analysis=parent.lichess.analysis;
      if (!this.options.extendedInteractive) return;
      if (!node) node=analysis.tree.root;
      node.gamebook=node.gamebook||{};
      if (!node.children) return;
      for (const child of node.children) {
        this.addGameBookToAllNodes(child);
      }
    };

    analysisControls=()=>{
      const parent=this.lichessTools;
      const $=parent.$;
      const trans=parent.translator;
      const lichess=parent.lichess;
      const analysis=lichess.analysis;
      if (!analysis?.study?.data?.chapter?.gamebook) return;
      const container=$('div.analyse__tools div.action-menu');
      if (!container.length) return;
      if (!$('.lichessTools-actionMenu').length) {
        const html=`<h2 class="lichessTools-actionMenu">$trans(interactiveLessonsText)</h2>
    <div class="setting abset-extendedInteractive" title="LiChess Tools - $trans(extendedInteractiveLesson.extendedInteractive)">
      <div class="switch">
        <input id="abset-extendedInteractive" class="cmn-toggle" type="checkbox" checked="">
        <label for="abset-extendedInteractive"></label>
      </div>
      <label for="abset-extendedInteractive">$trans(extendedInteractiveLesson.extendedInteractive)</label>
    </div>
    <div class="setting abset-showScore" title="LiChess Tools - $trans(extendedInteractiveLesson.showFinalScore)">
      <div class="switch">
        <input id="abset-showScore" class="cmn-toggle" type="checkbox" checked="">
        <label for="abset-showScore"></label>
      </div>
      <label for="abset-showScore">$trans(extendedInteractiveLesson.showFinalScore)</label>
    </div>
    <div class="setting abset-studyLinksSameWindow" title="LiChess Tools - $trans(extendedInteractiveLesson.studyLinksSameWindow)">
      <div class="switch">
        <input id="abset-studyLinksSameWindow" class="cmn-toggle" type="checkbox" checked="">
        <label for="abset-studyLinksSameWindow"></label>
      </div>
      <label for="abset-studyLinksSameWindow">$trans(extendedInteractiveLesson.studyLinksSameWindow)</label>
    </div>
    <div class="setting abset-returnToPreview" title="LiChess Tools - $trans(extendedInteractiveLesson.returnToPreview)">
      <div class="switch">
        <input id="abset-returnToPreview" class="cmn-toggle" type="checkbox" checked="">
        <label for="abset-returnToPreview"></label>
      </div>
      <label for="abset-returnToPreview">$trans(extendedInteractiveLesson.returnToPreview)</label>
    </div>`.replace(/\$trans\(([^\)]+)\)/g,m=>{
          return parent.htmlEncode(trans.noarg(m.slice(7,-1)));
        });
        $(html).insertBefore($('h2',container).eq(0));
        $('#abset-extendedInteractive,#abset-showScore,#abset-studyLinksSameWindow,#abset-returnToPreview')
          .on('change',async ()=>{
            const arr=[];
            const options=parent.currentOptions
            if ($('#abset-extendedInteractive').is(':checked')) arr.push('extendedInteractive');
            if ($('#abset-showScore').is(':checked')) arr.push('showFinalScore');
            if ($('#abset-studyLinksSameWindow').is(':checked')) arr.push('studyLinksSameWindow');
            if ($('#abset-returnToPreview').is(':checked')) arr.push('returnToPreview');
            options.extendedInteractiveLesson=arr.join(',');
            await parent.applyOptions(options);
            parent.fireReloadOptions();
          });
      }
      $('#abset-extendedInteractive')
        .prop('checked',this.options.extendedInteractive);
      $('#abset-showScore')
        .prop('checked',this.options.showFinalScore);
      $('#abset-studyLinksSameWindow')
        .prop('checked',this.options.studyLinksSameWindow);
      $('#abset-returnToPreview')
        .prop('checked',this.options.returnToPreview);
    };

    alterStudyLinksDirect=()=>{
      if (!this.options.studyLinksSameWindow) return;
      const parent=this.lichessTools;
      const $=parent.$;
      $('comment a[target],div.comment a[target]').each((i,e)=>{
        const href=$(e).attr('href');
        if (!/\/study\//.test(href)) return;
        $(e).removeAttr('target');
      });
    };

    alterStudyLinks=this.lichessTools.debounce(this.alterStudyLinksDirect,100);

    setupReset=()=>{
      const parent=this.lichessTools;
      const lichess=parent.lichess;
      this.state=parent.traverse();
      const analysis=lichess.analysis;
      const study=analysis?.study;
      if (!study) return;
      const trans=parent.translator;
      const modal=$('div.dialog-content');
      if (!modal.length) return;
      if (!this._paths) {
        const json=lichess.storage.get('LichessTools.chapterPaths');
        this._paths=parent.jsonParse(json,null);
      }
      if (!this._paths) return;
      const key=analysis.study.data.id+'/'+analysis.study.currentChapter()?.id;
      const paths=this._paths[key];
      const button = $('div.form-actions button.lichessTools-reset',modal);
      if (paths && (this.options.flow.sequential || this.options.flow.spacedRepetition)) {
        if (button.length) return;
        $('<button class="button button-red lichessTools-reset">')
          .attr('title',trans.noarg('resetButtonTitle'))
          .text(trans.noarg('resetButtonText'))
          .on('click',ev=>{
            ev.preventDefault();
            if (!parent.global.confirm(trans.noarg('resetQuestion'))) return;
            this.resetDone();
          })
          .insertBefore($('div.form-actions button[type="submit"]',modal));
      } else {
        button.remove();
      }
    };

    refreshChapterProgress=()=>{
      const parent=this.lichessTools;
      const lichess=parent.lichess;
      this.state=parent.traverse();
      const analysis=lichess.analysis;
      const study=analysis?.study;
      if (!study) return;
      const trans=parent.translator;
      if (!this._paths) {
        const json=lichess.storage.get('LichessTools.chapterPaths');
        this._paths=parent.jsonParse(json,null);
      }
      if (!this._paths) return;
      const list = study.chapters.list();
      $('div.study__chapters').addClass('lichesstools-extendedInteractiveLessonFlow');
      for (const chapter of list) {
        const key=study.data.id+'/'+chapter.id;
        const paths=this._paths[key];
        let perc='';
        if (paths) {
          let total=0;
          let doneCount=0;
          for (const k in paths) {
            if (k=='currentPath') continue;
            const item=paths[k];
            const done=this.options.flow.spacedRepetition
              ? item && Date.now()<item.time+item.interval*86400000
              : item?.success
            total++;
            if (done) doneCount++;
          }
          if (total) {
            perc=(100*doneCount/total)+'%';
            $('div.study__chapters div[data-id="'+chapter.id+'"]').attr('title',trans.pluralSame('progressTitle',doneCount+'/'+total));
          } else {
            $('div.study__chapters div[data-id="'+chapter.id+'"]').removeAttr('title');
          }
        }
        $('div.study__chapters div[data-id="'+chapter.id+'"] > i.act')
          .css('--perc',perc);
      }
    };

    async start() {
      const parent=this.lichessTools;
      const value=parent.currentOptions.getValue('extendedInteractiveLesson');
      const flow=parent.currentOptions.getValue('extendedInteractiveLessonFlow');
      this.logOption('Extended interactive lessons', value, 'flow',flow);
      const $=parent.$;
      const lichess=parent.lichess;
      const analysis=lichess?.analysis;
      const study=analysis?.study;
      if (!study) return;
      this.options={
        showFinalScore:parent.isOptionSet(value,'showFinalScore'),
        extendedInteractive:parent.isOptionSet(value,'extendedInteractive'),
        studyLinksSameWindow:parent.isOptionSet(value,'studyLinksSameWindow'),
        returnToPreview:parent.isOptionSet(value,'returnToPreview'),
        flow: {
          'sequential':parent.isOptionSet(flow,'sequential'),
          'spacedRepetition':parent.isOptionSet(flow,'spacedRepetition')
        }
      };
      if (!parent.isWrappedFunction(study.setGamebookOverride,'extendedInteractive')) {
        study.setGamebookOverride=parent.wrapFunction(study.setGamebookOverride,{
          id:'extendedInteractive',
          before:($this,o)=> {
            if (!o && !study.members.canContribute()) {
              o='play';
            }
            if (o=='play') {
              this._previewPath=analysis.path;
              // fix lichess bug where entering Preview mode with engine on keeps engine running
              if (analysis.ceval.enabled()) {
                analysis.ceval.stop();
                analysis.ceval.isDeeper(false);
              }
              if (this.options.extendedInteractive) this.addGameBookToAllNodes();
            } else {
              if (this.explorerEnabled && !analysis.explorer.enabled()) {
                analysis.explorer.enabled(true);
              }
            }
            // fix lichess bug with going to analysis after lesson finishes and showing the bad moves, too
            if (o=='analyse' && study.members.canContribute()) {
              const oldSetGamebookOverride=study.setGamebookOverride.__originalFunction;
              oldSetGamebookOverride();
            }
          },
          after:($this,result,o)=> {
            this.patchGamebook();
            const gp=analysis.gamebookPlay();
            gp?.makeState();
            analysis.redraw();
            if (o=='play') {
              analysis.userJump(analysis.path);
            }
          }
        });
      }
      lichess.pubsub.off('redraw',this.analysisControls);
      lichess.pubsub.on('redraw',this.analysisControls);
      lichess.analysis.actionMenu.toggle=lichessTools.unwrapFunction(lichess.analysis.actionMenu.toggle,'extendedInteractiveLesson');
      lichess.analysis.actionMenu.toggle=lichessTools.wrapFunction(lichess.analysis.actionMenu.toggle,{
        id:'extendedInteractiveLesson',
        after: ($this, result, ...args)=>{
          parent.global.setTimeout(this.analysisControls,100);
        }
      });
      this.analysisControls();
      lichess.pubsub.off('redraw',this.alterUI);
      lichess.pubsub.off('chapterChange',this.patchGamebook);
      if (this.options.extendedInteractive) {
        lichess.pubsub.on('redraw',this.alterUI);
      }
      if (this.options.extendedInteractive||this.options.showFinalScore) {
        lichess.pubsub.on('chapterChange',this.patchGamebook);
      }
      this.patchGamebook();

      lichess.pubsub.off('redraw',this.alterStudyLinks);
      lichess.pubsub.off('analysis.change',this.alterStudyLinks);
      lichess.pubsub.off('chapterChange',this.alterStudyLinks);
      if (lichess.socket) {
        lichess.socket.handle=parent.unwrapFunction(lichess.socket.handle,'extendedInteractiveLesson');
      }
      if (this.options.studyLinksSameWindow) {
        lichess.pubsub.on('redraw',this.alterStudyLinks);
        lichess.pubsub.on('analysis.change',this.alterStudyLinks);
        lichess.pubsub.on('chapterChange',this.alterStudyLinks);
        if (lichess.socket) {
          lichess.socket.handle=parent.wrapFunction(lichess.socket.handle,{
            id:'extendedInteractiveLesson',
            after:($this,result,m)=>{
              if (m.t=='setComment') this.alterStudyLinks();
            }
          });
        }
        this.alterStudyLinks();
      }

      study.chapters.editForm.toggle=parent.unwrapFunction(study.chapters.editForm.toggle,'extendedInteractiveLessonFlow');
      $('div.study__chapters').removeClass('lichesstools-extendedInteractiveLessonFlow');
      if (this.options.flow.sequential || this.options.flow.spacedRepetition) {
        this.refreshChapterProgress();
        study.chapters.editForm.toggle=parent.wrapFunction(study.chapters.editForm.toggle,{
          id:'extendedInteractiveLessonFlow',
          after:($this,result,data)=>{
            const interval=parent.global.setInterval(()=>{
              const currentChapterId=study.currentChapter()?.id;
              if (!currentChapterId) return;
              if (!study.data.chapter.gamebook) return;
              const modal=$('div.dialog-content');
              if (!modal.length) return;
              parent.global.clearInterval(interval);
              this.setupReset();
            },100);
          }
        });
      }
    }
  }

  LiChessTools.Tools.ExtendedInteractiveLesson=ExtendedInteractiveLessonTool;
})();
