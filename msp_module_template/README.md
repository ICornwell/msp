##This template is here for starting new modules##

use `cp -rf msp_module_template your_module_name`

then your favourite search/replace 'template_module' to <your_module_name>
and then 'Template_Module' to <Your_Module_Name>

then add it into msp/package.json workspaces, and scripts 
and also the main launch.json

and add some ports for it in msp/msp_svr_common/src/ports.js