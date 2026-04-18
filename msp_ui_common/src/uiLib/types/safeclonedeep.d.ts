declare module "index" {
    export = cloneWrap;
    function cloneWrap(obj: any, circularValue: any): any;
    namespace cloneWrap {
        let circularValue: any;
    }
}
