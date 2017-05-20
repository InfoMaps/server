/**
 * Created by raph on 20/05/17.
 */
const csv = require('csvtojson');
const LGA_CODES_PATH = "data/LGA_2016_QLD.csv";
const request = require('request');
var LGA_CODES = [];

var init = function(){
    return new Promise(function(resolve, reject){
        csv().fromFile(LGA_CODES_PATH)
            .on('json', function(jsonObj, rowIndex){
                console.log('searching for: '+jsonObj.LGA_CODE_2016);
                for(var i in LGA_CODES){
                    if(LGA_CODES[i].LGA_CODE_2016 == jsonObj.LGA_CODE_2016){
                        // console.log('already exists: '+jsonObj.LGA_CODE_2016);
                        return;
                    }
                }
                LGA_CODES.push(jsonObj);
            })
            .on('done', function(error){
                if(error){
                    reject()
                }else{
                    // console.log('data successfully transformed: ');
                    // console.log(LGA_CODES);
                    resolve();
                }
            });
    })
};

init().then(function(){
    console.log("LGA Codes found");
});

module.exports = function(app){

    app.get("/test", function(req, res){
        res.send("hello world");
    });
    app.get("/stats/marital", function(req, res){
        //here we sort through all the
        var state_code = '3';
        var result = [];
        var count = 0;

        for(var j in LGA_CODES){
            request("http://stat.data.abs.gov.au/sdmx-json/data/ABS_CENSUS2011_T04_LGA/1+3+2.5+TOT+4+3+2+1.A15+A20+A25+A30+A35+A40+A45+A50+A55+A60+A65+A70+A75+A80+V+TOT+O85.3.LGA2011+LGA."+LGA_CODES[j].LGA_CODE_2016+".A/all?detail=Full&dimensionAtObservation=AllDimensions", function(error, response, body){
                // console.log("response: "+JSON.stringify(response));
                // console.log("body: "+JSON.stringify(body));
                count++;
                try{
                    var data = JSON.parse(body);
                    console.log(JSON.stringify(data.dataSets[0].observations));
                    var entry = {};
                    for(var key in data.dataSets[0].observations){
                        var key_array = key.split(':');
                        entry.count = data.dataSets[0].observations[key][0];
                        entry.LGA_CODE = LGA_CODES[j].LGA_CODE_2016;
                        entry.LGA_NAME = LGA_CODES[j].LGA_NAME_2016;
                        for(var dim in data.structure.dimensions.observation){
                            for(var k in key_array){
                                if(data.structure.dimensions.observation[dim].keyPosition == k){
                                   for(var l in data.structure.dimensions.observation[dim].values){
                                       if(data.structure.dimensions.observation[dim].values[l].id == key_array[k]){
                                           entry[data.structure.dimensions.observation[dim].name] = data.structure.dimensions.observation[dim].values[l].name;
                                       }
                                   }
                                }
                            }
                        }
                    }
                    result.push(entry);
                    console.log("count: "+count+" : "+LGA_CODES.length);
                    if(count == LGA_CODES.length-3){
                        res.send(result);
                    }
                }catch(err){
                    // console.log(err);
                    console.log("Error at LGA code: "+LGA_CODES[j].LGA_CODE_2016);
                }

            });
        }
        // res.send("Hello world");
    });
};

