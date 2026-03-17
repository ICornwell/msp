
import { httpRequest } from "msp_common"
import Config from "../../api/config.js"
import { InformationManifestSection } from "msp_common"


const informationList: InformationManifestSection[] = [
  {
    name: 'Sample Feature',
    version: '1.0.0',
    description: 'A sample information set  for demonstration purposes',
    serverUrl: '/features/sample-information',
    namespace: 'sample-domain',
    allowedContexts: ['*'],
  }
]

function registerFeature(feature: InformationManifestSection) {
  informationList.push(feature)
  const responsePromise =  httpRequest.post(`${Config.uiBffUrl}/api/v1/discovery/registerInformation`, feature)
  return responsePromise;
}

function getInformations() {
  return informationList
}

export const informationRegistry = {
  registerFeature,
  getInformations
}