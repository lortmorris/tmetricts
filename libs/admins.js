/***
 * CB (err, data);
 * @param db
 */

var crypto = require('crypto');
var shasum = crypto.createHash('md5');


function admins(context){
    var self = this;
    self.db = context.db;

};

admins.prototype.add = function(params){
    var self = this;

    var email = params.email || "";
    var password = params.password || "";

    var ps = shasum.update(params.password).digest("hex");


    return new Promise((resolve, reject)=>{

        self.db.admins.save({
            email: params.email
            ,added: new Date()
            ,password : ps
        }, function(err, docs){
            if(err){
                debug('Error ADM200');
                reject('Error ADM200');
            }else{
                resolve(docs);
            }
        });
    });//end promise
};


admins.prototype.login = function(params){

    var self = this;
    var email = params.email || "";
    var password  = params.password ||  "";
    var ps = shasum.update(password).digest("hex");

    self.db.admins.findOne({email: email, password: ps}, {}, function(err, data){
        if(err){ reject('Error ADM206'); }
        else{
            if(data){
                cb(null, data);
                self.db.admins.update({_id: data._id}, {$set: {lastlogin: new Date()}}, function(err, data2){
                    if(err) reject('Error ADM208');
                    else resolve(data)
                });
            }else{
                reject('bad login');
            }//end else
        }//end else
    });

};//end login


module.exports = admins;