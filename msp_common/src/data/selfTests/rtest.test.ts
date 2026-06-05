import { Flatten } from '../fluent/builderUtils';

type file = {
    name: string;
}

type folder = {
    name: string;
    children: {
        folders: folder[];
        files: file[];
    };
}

const src: folder = {
    name: 'src',
    children: {
        files: [],
        folders: [
            {
                name: 'data',
                children: {
                    files: [],
                    folders: [
                        {
                            name: 'fluent',
                            children: {
                                folders: [],
                                files: [
                                    { name: 'objectBuilder.ts' },
                                    { name: 'viewBuilder.ts' }
                                ]
                            }
                        },
                        {
                            name: 'models',
                            children: {
                                files: [],
                                folders: [
                                    {
                                        name: 'api',
                                        children: {
                                            folders: [],
                                            files: [
                                                { name: 'data.ts' }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        ]
    }
}


let f: Flatten<folder> = {
    name: 'src',
    children: {
        files: [],
        folders: [{
            name: 'data',
            children: {
                files: [],
                folders: [{
                    name: 'fluent',
                    children: {
                        files: [
                            { name: 'objectBuilder.ts' },
                            { name: 'viewBuilder.ts' }
                        ],
                        folders: [{
                            name: 'data',
                            children: {
                                files: [],
                                folders: [{
                                    name: 'fluent',
                                    children: {
                                        files: [
                                            { name: 'objectBuilder.ts' },
                                            { name: 'viewBuilder.ts' }
                                        ],
                                        folders: []
                                    }
                                }]
                            }
                        }
                        ]
                    }
                }]
            }
        }
        ]
    }
}