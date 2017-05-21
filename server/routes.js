/**
 * Created by raph on 20/05/17.
 */
const csv = require('csvtojson');
const LGA_CODES_PATH = "data/LGA_2016_QLD.csv";
const request = require('request');
var LGA_CODES = [];
var queries = [
    labour_force = "http://stat.data.abs.gov.au/sdmx-json/data/ABS_CENSUS2011_B42_LGA/1+3+2.A15+A20+O15+O85+T25+T35+T45+T55+T65+T75.TOT+1+EMP+2+3+4+5+UEMP+6+LF+7+Z.<STATE_CODE>.LGA2011+LGA.<LGA_CODE>.A/all?detail=Full&dimensionAtObservation=AllDimensions",
    household_income = "http://stat.data.abs.gov.au/sdmx-json/data/ABS_CENSUS2011_B28_LGA/TOT+1_2+3.TOT+01_02+03+04+05+06+07+08+09+10+11+12+13+14+15+16_17+18+Z.<STATE_CODE>.LGA2011+LGA.<LGA_CODE>.A/all?detail=Full&dimensionAtObservation=AllDimensions"
];

var collectedData = {
    household_income : null,
    labour_force : null,
    personal_income : null,
    schooling : null,
    english_proficiency : null,
    averages : {
        QLD : {
            unemployment : null
        }
    }
};

var init = {
    LGA : function(){
        return new Promise(function(resolve, reject){
            csv().fromFile(LGA_CODES_PATH)
                .on('json', function(jsonObj, rowIndex){
                    for(var i in LGA_CODES){
                        if(LGA_CODES[i].LGA_CODE_2016 == jsonObj.LGA_CODE_2016){
                            return;
                        }
                    }
                    LGA_CODES.push(jsonObj);
                })
                .on('done', function(error){
                    if(error){
                        reject()
                    }else{
                        resolve();
                    }
                });
        })
    },
    labourForceData : function() {
        return new Promise(function (resolve, reject) {
            var state_code = '3';
            var result = [];
            var total = 0;
            var totalUnemployed = 0;
            var LGA_CODE_REGEX = /LGA.\s*(.*?)\s*.A/g;
            var count = 0;
            // console.log("loading labour force");
            for (var j in LGA_CODES) {
                (function(LGA_CODE){
                    // console.log(LGA_CODE);
                    request("http://stat.data.abs.gov.au/sdmx-json/data/ABS_CENSUS2011_B42_LGA/1+3+2.A15+A20+O15+O85+T25+T35+T45+T55+T65+T75.TOT+1+EMP+2+3+4+5+UEMP+6+LF+7+Z.3.LGA2011+LGA."+LGA_CODE.LGA_CODE_2016+".A/all?detail=Full&dimensionAtObservation=AllDimensions", function (error, response, body) {
                        count++;
                        try {
                            var data = JSON.parse(body);
                            for (var key in data.dataSets[0].observations) {
                                var key_array = key.split(':');
                                var entry = {};
                                entry.count = data.dataSets[0].observations[key][0];
                                total += Number(data.dataSets[0].observations[key][0]);
                                entry.LGA_CODE = LGA_CODE.LGA_CODE_2016;
                                entry.LGA_NAME = LGA_CODE.LGA_NAME_2016;
                                for (var dim in data.structure.dimensions.observation) {
                                    for (var k in key_array) {
                                        if (data.structure.dimensions.observation[dim].keyPosition == k) {
                                            for (var l in data.structure.dimensions.observation[dim].values) {
                                                if (l == Number(key_array[k])) {
                                                    entry[data.structure.dimensions.observation[dim].name] = data.structure.dimensions.observation[dim].values[l].name;
                                                }
                                            }
                                        }
                                    }
                                }
                                if((entry["Labour Force Status"] == "Unemployed total")||(entry["Labour Force Status"] == "Not in the labour force")){
                                    totalUnemployed += Number(data.dataSets[0].observations[key][0]);
                                }
                                result.push(entry);
                            }
                            // console.log("count: " + count + " : " + LGA_CODES.length);
                            if (count >= LGA_CODES.length - 2) {
                                // console.log("sending");
                                // console.log("total is: "+total);
                                // console.log("total 2 is: "+totalUnemployed);
                                // console.log("total unemployment: "+(totalUnemployed/total));
                                collectedData.averages.QLD.unemployment = (totalUnemployed/total)*100;
                                resolve(result);
                            }
                        } catch (err) {
                            // console.log("Error at LGA code: " + LGA_CODES[j].LGA_CODE_2016);
                        }

                    });
                })(LGA_CODES[j]);
            }
        })
    },
    householdIncomeData : function(){
        return new Promise(function (resolve, reject) {
            var state_code = '3';
            var result = [];
            var count = 0;

            for (var j in LGA_CODES) {
                (function(LGA_CODE){
                    request("http://stat.data.abs.gov.au/sdmx-json/data/ABS_CENSUS2011_B28_LGA/TOT+1_2+3.TOT+01_02+03+04+05+06+07+08+09+10+11+12+13+14+15+16_17+18+Z.3.LGA2011+LGA."+LGA_CODE.LGA_CODE_2016+".A/all?detail=Full&dimensionAtObservation=AllDimensions", function (error, response, body) {
                        count++;
                        try {
                            var data = JSON.parse(body);
                            // console.log(JSON.stringify(data.dataSets[0].observations));

                            for (var key in data.dataSets[0].observations) {
                                var key_array = key.split(':');
                                var entry = {};
                                entry.count = data.dataSets[0].observations[key][0];
                                entry.LGA_CODE = LGA_CODE.LGA_CODE_2016;
                                entry.LGA_NAME = LGA_CODE.LGA_NAME_2016;
                                for (var dim in data.structure.dimensions.observation) {
                                    for (var k in key_array) {
                                        if (data.structure.dimensions.observation[dim].keyPosition == k) {
                                            for (var l in data.structure.dimensions.observation[dim].values) {
                                                if (l == Number(key_array[k])) {
                                                    entry[data.structure.dimensions.observation[dim].name] = data.structure.dimensions.observation[dim].values[l].name;
                                                }
                                            }
                                        }
                                    }
                                }
                                result.push(entry);
                            }
                            console.log("count: " + count + " : " + LGA_CODES.length);
                            if (count >= LGA_CODES.length - 2) {
                                resolve(result);
                            }
                        } catch (err) {
                            console.log("Error at LGA code: " + LGA_CODE.LGA_CODE_2016);
                        }

                    });
                })(LGA_CODES[j]);

            }
        })
    },
    highestYearSchoolData : function(){
        return new Promise(function (resolve, reject) {
            var state_code = '3';
            var result = [];
            var count = 0;

            for (var j in LGA_CODES) {
                (function(LGA_CODE){
                    request("http://stat.data.abs.gov.au/sdmx-json/data/ABS_CENSUS2011_B16_LGA/1+3+2.A15+A20+O15+O85+T25+T35+T45+T55+T65+T75.TOT+1+2+3+4+5+6+Z.1+0+2+3+4+5+6+7+8+9.LGA2011+LGA."+LGA_CODE.LGA_CODE_2016+".A/all?detail=Full&dimensionAtObservation=AllDimensions", function (error, response, body) {
                        count++;
                        try {
                            var data = JSON.parse(body);
                            // console.log(JSON.stringify(data.dataSets[0].observations));

                            for (var key in data.dataSets[0].observations) {
                                var key_array = key.split(':');
                                var entry = {};
                                entry.count = data.dataSets[0].observations[key][0];
                                entry.LGA_CODE = LGA_CODE.LGA_CODE_2016;
                                entry.LGA_NAME = LGA_CODE.LGA_NAME_2016;
                                for (var dim in data.structure.dimensions.observation) {
                                    for (var k in key_array) {
                                        if (data.structure.dimensions.observation[dim].keyPosition == k) {
                                            for (var l in data.structure.dimensions.observation[dim].values) {
                                                if (l == Number(key_array[k])) {
                                                    entry[data.structure.dimensions.observation[dim].name] = data.structure.dimensions.observation[dim].values[l].name;
                                                }
                                            }
                                        }
                                    }
                                }
                                result.push(entry);
                            }
                            // console.log("count: " + count + " : " + LGA_CODES.length);
                            if (count >= LGA_CODES.length - 2) {
                                // console.log("sending");
                                resolve(result);
                            }
                        } catch (err) {
                            console.log("Error at LGA code: " + LGA_CODE.LGA_CODE_2016);
                        }

                    });
                })(LGA_CODES[j]);

            }
        })
    }

};

var initialise = function(){
    init.LGA().then(function () {
        console.log("LGAs loaded");
        init.labourForceData().then(function (result) {
            collectedData.labour_force = result;
            console.log("Labour Force Data loaded");
        });
        init.householdIncomeData().then(function(result){
            collectedData.household_income = result;
            console.log("Household Income Data loaded");
        });
        init.highestYearSchoolData().then(function(result){
            collectedData.highestYearSchool = result;
            console.log("Highest Year Completed Data loaded");
        });
    });
};
initialise();

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
    });

    app.get("/stats/labour", function(req, res){
        //here we sort through all the
        var state_code = '3';
        var result = [];
        var count = 0;

        for(var j in LGA_CODES){
            request("http://stat.data.abs.gov.au/sdmx-json/data/ABS_CENSUS2011_B42_LGA/1+3+2.A15+A20+O15+O85+T25+T35+T45+T55+T65+T75.TOT+1+EMP+2+3+4+5+UEMP+6+LF+7+Z.3.LGA2011+LGA."+LGA_CODES[j].LGA_CODE_2016+".A/all?detail=Full&dimensionAtObservation=AllDimensions", function(error, response, body){
                count++;
                try{
                    var data = JSON.parse(body);
                    console.log(JSON.stringify(data.dataSets[0].observations));

                    for(var key in data.dataSets[0].observations){
                        var key_array = key.split(':');
                        var entry = {};
                        entry.count = data.dataSets[0].observations[key][0];
                        entry.LGA_CODE = LGA_CODES[j].LGA_CODE_2016;
                        entry.LGA_NAME = LGA_CODES[j].LGA_NAME_2016;
                        for(var dim in data.structure.dimensions.observation){
                            for(var k in key_array){
                                if(data.structure.dimensions.observation[dim].keyPosition == k){
                                    for(var l in data.structure.dimensions.observation[dim].values){
                                        if(l == Number(key_array[k])){
                                            entry[data.structure.dimensions.observation[dim].name] = data.structure.dimensions.observation[dim].values[l].name;
                                        }
                                    }
                                }
                            }
                        }
                        result.push(entry);
                    }
                    console.log("count: "+count+" : "+LGA_CODES.length);
                    if(count >= LGA_CODES.length-2){
                        console.log("sending");
                        res.send(result);
                    }
                }catch(err){
                    // console.log(err);
                    console.log("Error at LGA code: "+LGA_CODES[j].LGA_CODE_2016);
                }

            });
        }
    });

    app.get("/data/labour_force", function(req, res){
       res.send(collectedData.labour_force);
    });

    app.get("/data/household_income", function(req, res){
       res.send(collectedData.household_income);
    });

    app.post("/indicators", function(req, res){
        console.log("Inidicators: "+JSON.stringify(req.body));
        var result = [];
        //populate result array

        for(var i in LGA_CODES){
            result.push({
                id:LGA_CODES[i].LGA_CODE_2016,
                labour_force : {
                    total : 0,
                    unemployed : 0,
                    indicator : 0
                },
                houseIncome : {
                    total : 0,
                    belowAverage : 0,
                    wellBelowAverage : 0,
                    farBelowAverage : 0,
                    inidicator : 0,
                }
            })
        }
        console.log("req body"+JSON.stringify(req.body));
        if(req.body.labourForce){
            for(var j in collectedData.labour_force){
                for(var k in result){
                    if(result[k].id == collectedData.labour_force[j].LGA_CODE){
                        console.log("Found...");
                        result[k].labour_force.total += collectedData.labour_force[j].count;
                        if(collectedData.labour_force[j]["Labour Force Status"] == "Unemployed total"){
                            result[k].labour_force.unemployed += collectedData.labour_force[j].count;
                        }
                    }
                }
            }
            for(var k in result){
                result[k].labour_force.percent_unemployed = ((result[k].unemployed/result[k].total)*100);
                result[k].labour_force.national_avg = collectedData.averages.QLD.unemployment;
                result[k].labour_force.deviation = collectedData.averages.QLD.unemployment - ((result[k].labour_force.unemployed/result[k].labour_force.total)*100);
            }
        }
        if(req.body.houseIncome){
            for(var j in collectedData.household_income){
                for(var k in result){
                    if(result[k].id == collectedData.household_income[j].LGA_CODE){
                        console.log("Found...");
                        result[k].houseIncome.total += collectedData.household_income[j].count;
                        if((collectedData.houseIncome[j]["Total Household Income (weekly)"] == "$1-$199")||
                            (collectedData.houseIncome[j]["Total Household Income (weekly)"] == "$200-$299")||
                            (collectedData.houseIncome[j]["Total Household Income (weekly)"] == "$300-$499")
                        ){
                            result[k].houseIncome.farBelowAverage += collectedData.household_income[j].count;
                        }else if((collectedData.houseIncome[j]["Total Household Income (weekly)"] == "$500-$599")||
                            (collectedData.houseIncome[j]["Total Household Income (weekly)"] == "$600-$699")||
                            (collectedData.houseIncome[j]["Total Household Income (weekly)"] == "$700-$799")
                        ){
                            result[k].houseIncome.wellBelowAverage += collectedData.household_income[j].count;
                        }else if((collectedData.houseIncome[j]["Total Household Income (weekly)"] == "$500-$599")||
                            (collectedData.houseIncome[j]["Total Household Income (weekly)"] == "$600-$699")||
                            (collectedData.houseIncome[j]["Total Household Income (weekly)"] == "$700-$799")
                        ){
                            result[k].houseIncome.wellBelowAverage += collectedData.household_income[j].count;
                        }


                    }
                }
            }
            for(var k in result){
                result[k].labour_force.percent_unemployed = ((result[k].unemployed/result[k].total)*100);
                result[k].labour_force.national_avg = collectedData.averages.QLD.unemployment;
                result[k].labour_force.deviation = collectedData.averages.QLD.unemployment - ((result[k].labour_force.unemployed/result[k].labour_force.total)*100);
            }
        }
        for(var l in result){
            result[l].indicator = result[l].labour_force.deviation;
        }

        res.send(result);
        // res.send("Hello World");
    });

    // app.get("/stats/labour", function(req, res){
    //     console.log("Stats Labour");
    //     var calls = [];
    //     for(var j in LGA_CODES){
    //         calls.push(query_abs(queries.labour_force, LGA_CODES[j], '3'));
    //     }
    //
    //     Promise.all(calls).then(function(result){
    //         res.send(result);
    //     })
    // })
};
