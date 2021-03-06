import ignore from '../../../ignore'
import dynamic from "next/dynamic";

import { useRouter } from 'next/router'

import Layout from '../../../components/layout'
import GaWrapper from '../../../components/gawrapper'

import ModelHeader from '../../../components/model/header'

// const ModelDynamic = dynamic(() => import("../../../components/model/dynamic"), { ssr: false });

import ModelDynamic from '../../../components/model/dynamic'

import fs from 'fs'
import path from 'path'
import { useEffect, useState } from "react";
import Seo from "../../../components/seo";

function Model({data}) {

  const [currentData, setCurrentData] = useState([])

  useEffect(() => {
    setCurrentData(data)
  },[]);

  const router = useRouter();
  const {model, manufacturer} = router.query;

  const image = data[0].modelImagePath
  return (
    <GaWrapper>
      <Layout>
          <Seo 
            title={`Актуальна ціна та вартість вододіння ${manufacturer.toUpperCase()} ${model.toUpperCase()} `}
            description={`Всі витрати при володінні та Актуальна ціна ${manufacturer.toUpperCase()} ${model.toUpperCase()} доступні всі комплектації`}
            currentPath={`${manufacturer.toLocaleLowerCase()}/${model.toLocaleLowerCase()}`} 
          />
          <ModelHeader data={currentData} model={model} manufacturer={manufacturer}/>
          <ModelDynamic data={currentData} model={model} manufacturer={manufacturer} image={image}/>
      </Layout>
    </GaWrapper>
  )
}

export async function getStaticPaths() {
  // Manufacturers 
  const currentAllManufacturerPath = path.join(process.cwd(), 'public', 'manufacturers')

  // Get the array of all manufactureres 
  const manufacturersFileNames = fs.readdirSync(currentAllManufacturerPath)

  const manufacturersFilteredNames = manufacturersFileNames
    .filter(i => i.indexOf('.DS_Store') === -1)
    .filter(i => {
      if (!ignore.ignore.includes(i)) {
        return i
      }
    })
  

  let finalPaths = []
  // loop through each manufacturer
  manufacturersFilteredNames.map(i => {
    const currentManufacturerPath = path.join(process.cwd(), 'public', 'manufacturers', i)
    const modelFileNames = fs.readdirSync(currentManufacturerPath) 

    const availableCurrentModels = modelFileNames
      .filter(i => i.indexOf('.DS_Store') === -1)
      .filter(i => i.includes('json'))
      .map(cur => {
        cur = encodeURIComponent(cur.trim())
        return cur
      })
      .map((filename) => ({model: filename.replace('.json', '').replace(`${i}_`, '')}))
  

    const availableCurrentModelsValues = Object.values(availableCurrentModels)  
    const addCurrentManufacturer = availableCurrentModelsValues.map(el => {


      el.manufacturer = i
      return el
    })


    const availableCurrentModelsPaths = addCurrentManufacturer.map(elem => (Object.assign({}, {'params': elem})))

    finalPaths = finalPaths.concat(availableCurrentModelsPaths)
    
  })

  // console.log(finalPaths);

  return { 
    paths: finalPaths, 
    fallback: false }
}

export async function getStaticProps({params}) {
  const { manufacturer, model } = params
  // console.log(manufacturer)
  // console.log(model)
  let modelImagePath = ''
  const currentImage = `public/manufacturers/${manufacturer}/images/${manufacturer}_${model}_0.jpg`

  if (fs.existsSync(currentImage)) {
    modelImagePath = currentImage.replace('public', '')
  } else {
    modelImagePath = `/logo@3x.png`
  }
  const reqUrl = `public/manufacturers/${manufacturer}/${manufacturer}_${model}.json`
  // console.log(reqUrl)
  const rawData = fs.readFileSync(reqUrl)

  const data = JSON.parse(rawData).filter(j => j.deprecated != 'true');

  const newData = data.forEach((item,idx) => {
    return Object.assign(item, {modelImagePath: modelImagePath})
  })

  // const newData = Object.assign(data, {modelImagePath} )

  return {props: {data} }
}

export default Model