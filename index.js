// ゲーミング用の基準では、GPU 性能が 60%、CPU 性能が 25%、RAM が 12.5%、ストレージが 2.5% となります。
// 作業用コンピュータは、CPU 性能 60%、GPU 性能 25%、RAM 10%、ストレージ 5% を基準としています。
const gameValues = {"CPU": 0.6, "GPU": 0.25, "RAM":0.125, "Storage":0.025 };
const workValues = {"CPU": 0.25, "GPU": 0.6, "RAM":0.1, "Storage":0.05 };

// initの時にtotal変数は0にしておく
// 各パーツの最後のセレクトタグが選ばれた時点で、そのプロダクトのベンチマークをgame, workそれぞれのディクショのレートとの積をtotalにそれぞれ加える
// totalは常に画面の下の方に表示しておく。%が単位
let totalGame = 0;
let totalWork = 0;


const config = {
    partsUrl: "https://api.recursionist.io/builder/computers?type=",
    // セレクトタグのid→クエリーセレクターで選ぶ
    cpuBrand: "#cpuBrand",
    cpuModel: "#cpuModel",
    gpuBrand: "#gpuBrand",
    gpuModel: "#gpuModel",
    memoryAmount: "#memoryAmount",
    memoryBrand: "#memoryBrand",
    memoryModel: "#memoryModel",
    storageType: "#storageType",
    storageSize: "#storageSize",
    storageBrand: "#storageBrand",
    storageModel: "#storageModel",
    gameBenchmark: "#gameBenchmark",
    workBenchmark: "#workBenchmark"

}

// 🚨 メモリはhow manyのところで、モデル名の末にあるサイズを取得して、set & ソートした上で、それをセレクトタグに追加させる必要がある。
// 🚨 hdd, ssdに関しては、まずhdd, ssdを選ぶセレクトタグの上で、ストレージをメモリと同様の手順を踏んでセレックとタグに追加する必要がある→関数を再利用できると思う
// →いずれも、上記が終わってからbrand, modelの追加になる。
// メモリは余分にサイズなどを作成してセレクトタグに入れる処理を初期化の時にやる必要がある
// ストレージは、hdd, ssdをユーザーが選択するまでフェッチできないので、これだけユーザーが選択してからフェッチから始めていく

// 以下のように、各関数にはh必要最低限の役割を持たせておくことで、様々な部分で再利用することができる
// APIのフェッチ
// brand, modelをキーにして、それぞれデータタイプが異なっても、引数にデータを入れて1つの関数で辞書を作ることはできないか？
    // {brand: 辞書}, {model: int}

// セレクトタグへの追加→parentIdを渡す
// brandをキーにしてデータを値にした辞書brandDicを返す
// brandDicをもとにmodel選択するためのセレクトタグへの追加→parentIdを渡す
// modelをキーにしてベンチマークスコアを値にした辞書の初期化→その後の選択した後に、重み計算をするために、これだけグローバルでも使えるようにリターンする

// ブランド名をキーにして、それぞれにproductとしてデータを格納した配列を値にする
let brandDictCPU = {};
let brandDictGPU = {};

// モデル名をキーにして、それぞれにproductとしてデータを格納した配列を値にする つまり、defaultdictと考える。
// →CPUのBrandを例にとれば、Intelというブランド名をキーとしてそのプロダクトを配列にプッシュしたものを値としている "Intel": [data1, data2, ... , dataN]
let modelDictCPU = {};
let modelDictGPU = {};
let amountDictRAM = {};
let brandDictRAM = {};
let modelDictRAM = {};
let brandDictStorage = {};
let modelDictStorage = {};


async function fetchURL(parts_type){
    const response = await fetch(config.partsUrl + parts_type);

    const data = await response.json();

    return data;
}

// 引数：1つ目→親要素を指定するためのクエリー 2つ目→APIから引っ張ってきたでーた 3つ目→オブジェクトの中の欲しい項目(ex: "Brand")
function appendOptionElements(query, data, targetName){
    let selector = document.querySelector(query);
    
    while(selector.children.length > 1){
        selector.removeChild(selector.lastChild);
    }

    selector.options[0].selected = true;
    
    let dict = {};
    

    for(let product of data){

        let targetVal = product[targetName];

        if(query == '#memoryAmount')
            targetVal = numberOfParts(targetVal)[0];

        if(query == '#storageSize')
            targetVal = numberOfParts(targetVal);

        if(!(targetVal in dict)){
            let optionElement = document.createElement("option");
            optionElement.value = targetVal;
            optionElement.innerHTML = targetVal;

            selector.append(optionElement);
            dict[targetVal] = [];
        }

        dict[targetVal].push(product);
    }

    return dict;
}

// メモリの数をモデル名から取得する→メモリの数がセレクトタグに入ったら、メモリ数: [商品, ]を返す
function numberOfParts(model){
    const modelArr = model.split(" ");
    return modelArr[modelArr.length - 1];
}


// 4/10: なぜかブラウザ上でNaNとなってしまう
function calcBenchMark(parts_type, benchMark){

    totalGame += Math.floor(gameValues[parts_type] * benchMark);
    totalWork += Math.floor(workValues[parts_type] * benchMark);

    document.querySelector(config.gameBenchmark).innerHTML = String(totalGame) + "%";
    document.querySelector(config.workBenchmark).innerHTML = String(totalWork) + "%";
}

// 最終的に選ばれたモデルをディクショナリから撮ってきて、ベンチマーク計算関数に渡す
function chooseModel(parts_type, product_dict, target_model){
    for(const modelName in product_dict){
        for(const product of product_dict[modelName]){
            if(product["Model"] == target_model){
                calcBenchMark(parts_type, product['Benchmark']);
                return;
            }
        }
    }
}



// ブラウザが読み込まれたら実行する
async function init(){

    totalGame = 0;
    totalWork = 0;
    document.querySelector(config.gameBenchmark).innerHTML = String(totalGame) + "%";
    document.querySelector(config.workBenchmark).innerHTML = String(totalWork) + "%";

    const cpuData = await fetchURL("cpu");
    const gpuData = await fetchURL("gpu");
    const memoryData = await fetchURL("ram");


    brandDictCPU = appendOptionElements(config.cpuBrand, cpuData, "Brand");
    brandDictGPU = appendOptionElements(config.gpuBrand, gpuData, "Brand");
    amountDictRAM = appendOptionElements(config.memoryAmount, memoryData, "Model");
}


// ブラウザ起動時に実行
init();

// 各セレクトタグが変更されたらそれに応じた処理を行う

document.querySelector(config.cpuBrand).addEventListener('change', e => {
    // e.target.valueには例えば"Intel"のような文字列が入っている。
    // その上で辞書にブランド名を渡してappendOptinon関数にIntelをキーにした配列を渡しているのだ。
    // それによって特定のブランド名の全ての商品をセレクトに入れることができる
    modelDictCPU = appendOptionElements(config.cpuModel, brandDictCPU[e.target.value], 'Model');
}) 


document.querySelector(config.cpuModel).addEventListener('change', e => {
    chooseModel('CPU', modelDictCPU, e.target.value);
})


document.querySelector(config.gpuBrand).addEventListener('change', e => {
    // e.valueにはブランド名が入っている。これをもとにモデル用のセレクトタグにモデル名をoptionValueにしたオプション要素を追加していく
    // 最後に、modelDictを返して更新する
    modelDictGPU = appendOptionElements(config.gpuModel, brandDictGPU[e.target.value], 'Model');
})


document.querySelector(config.gpuModel).addEventListener('change', e => {
    chooseModel('GPU', modelDictGPU, e.target.value);
})


document.querySelector(config.memoryAmount).addEventListener('change', e => {
    brandDictRAM = appendOptionElements(config.memoryBrand, amountDictRAM[e.target.value], 'Brand');
}) 


document.querySelector(config.memoryBrand).addEventListener('change', e => {
    modelDictRAM = appendOptionElements(config.memoryModel, brandDictRAM[e.target.value], 'Model');
})


document.querySelector(config.memoryModel).addEventListener('change', e => {
    chooseModel('RAM', modelDictRAM, e.target.value);
})



// HDD or SSD のどちらかを選ぶ→片方が選ばれたら、それの情報をもつAPIをフェッチする→フェッチされたデータをセレクトタグに追加した上で、sizeDictStorageに配列を持ったディクトを返す
document.querySelector(config.storageType).addEventListener('change', async function(e) {
    let storageData = [];

    if(e.target.value == 'HDD'){
        storageData = await fetchURL("hdd");
    }else{
        storageData = await fetchURL("ssd");
    }
    sizeDictStorage = appendOptionElements(config.storageSize, storageData, 'Model');

})

// ストレージサイズを選択したらストレージブランドがセレクトタグに追加される
document.querySelector(config.storageSize).addEventListener('change', e => {
    brandDictStorage = appendOptionElements(config.storageBrand, sizeDictStorage[e.target.value], 'Brand');
})


// // ストレージブランドを選択したらストレージモデルがセレクトタグに追加される
document.querySelector(config.storageBrand).addEventListener('change', e => {
    modelDictStorage = appendOptionElements(config.storageModel, brandDictStorage[e.target.value], 'Model');
})


document.querySelector(config.storageModel).addEventListener('change', e => {
    chooseModel('Storage', modelDictStorage, e.target.value);
})