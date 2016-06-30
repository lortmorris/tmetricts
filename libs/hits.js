"use strict";

function hits(context){
    var self = this;
    self.db = context.db;
};


hits.prototype.save = function(){
    var self = this;

    return new Promise((resolve, reject)=>{
        self.db.hits.save(hit, function(err, docs){
            err ?  reject('Error HTH200 '+err) :  resolve(docs);
        });
    });
};


module.exports = hits;