import { ArtefactAssertionsView } from './pamelaMetaModel.js'
import { ReadData, WriteData} from 'msp_svr_common'


  export async function writeArtefactAssertionsView(data: typeof ArtefactAssertionsView.dataType) {
    await WriteData(ArtefactAssertionsView, data);
  }

  export async function readArtefactAssertionsView(artefactName: string) {
    return await ReadData(ArtefactAssertionsView, artefactName);
  }

  