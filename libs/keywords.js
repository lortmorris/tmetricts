"use strict";

require("debug")("tweetometro:libs:keywords");

function keywords(context){
    var self = this;
    self.db  = context.db;
    self.init();
}


keywords.prototype.addKey = function(id, key){
    var self  =this;

    return new Promise((resolve, reject)=>{
        self.db.keywords.save({
            keyword: key
            ,target: id
            ,count: 0
        }, (err, docs)=>{
            err ?  reject('Error FJF100') : resolve(docs);
        });
    });
}


keywords.prototype.process = function(hit){

    var self = this;

    for(var x=0; x<hit.keywords.length; x++){
        var k = hit.keywords[x];

        if(typeof self.keys[k]!="undefined") {
            self.keys[k].count++;
        }//
    }//end for


    var $set = {
        process : true
        ,step1 : true
    };


    if(hit.keywords.length==0){
        $set.key = false;
    }


    return new Promise((resolve, reject)=>{

        self.db.hits.update({_id: self.db.ObjectId(hit._id.toString())}
            ,{$set: $set}, (err, d)=>{
                err ?  reject(err): resolve(d);
            });
    });

}


keywords.prototype.updateKeywordsStats = function(){
    var self = this;
    var targets = {};


    return new Promise(function(resolve, reject){

            for(var x in _this.keys){
                var key = _this.keys[x];

                typeof targets[key.target]=="undefined"
                    ? targets[key.target] = {count: key.count}
                    : targets[key.target].count+=key.count;


                (function(k){
                    self.db.keywords.update({_id: self.db.ObjectId(k._id.toString())}
                        , {$set: {count: k.count}}, function(err, d){
                            if(err){ reject('Error FJF200'); }
                            else{}
                        });
                })(key);
            }//end for keywords


            for(var x in targets){

                (function(can){
                    _this.db.targets.update({_id: _this.db.ObjectId(x)}
                        , {$set:{count: can.count}}, function(err, d){
                            if(err){ reject('Error FJF201'); }
                            else{ }
                        });
                })(targets[x]);
            }//end for targets

        resolve();
    }); //end promise
};

keywords.prototype.loadKeywords = function(){
var self = this;
    self.keys = {};

    return new Promise(function(resolve, reject){
        self.db.keywords.find({}, {}, function(err, keys){
            if(err) reject('Error FJF203')
            else {
                for(var x=0; x<keys.length; x++){
                    self.keys[keys[x].keyword] = {count: keys[x].count, target: keys[x].target, _id: keys[x]._id};
                }//end for
            } //end else

            resolve(self.keys);
        });
    });//end primise

};

keywords.prototype.getHits = function(){
    var self = this;

    return new Promise(function(resolve, reject){
        self.db.hits.find({process:false}, {}).limit(100).toArray(function(err, docs){
            if(err) reject('Error FJF204');
            else{
                var pr = new Promise(function(resolve, reject){});
                for(var x=0; x<docs.length; x++) {
                    pr.then(function(){
                        return self.process(docs[x]);
                    });
                }

                pr.then(function(){

                }, function(err){
                    reject('Error FJF 210 '+err);
                });
            }//end else

            if(docs.length>0) {
               return self.updateKeywordsStats()
                   .then(function(){
                       resolve();
                   }, function(err){
                       reject('Error FJF 206 '+err);
                   });
            }else resolve();
        });
    });//end promises

};

keywords.prototype.init = function(){
    var self = this;

    setInterval(function(){
        self.loadKeywords()
            .then(function(){
                return self.getHits();
            }, function(err){
                reject('Error FJF 216 '+err);
            })
    }, 1000);

};



module.exports = keywords;