import "regenerator-runtime/runtime";
import * as Zcl from '../src/zcl';
import {Direction, FrameType, DataType, BuffaloZclDataType} from '../src/zcl/definition';
import BuffaloZcl from '../src/zcl/buffaloZcl';

describe('Zcl', () => {

    it('Get cluster by name', () => {
        const cluster = Zcl.Utils.getCluster('genIdentify');
        expect(cluster.ID).toBe(3);
        expect(cluster.name).toBe('genIdentify');
        expect(cluster.commands.identifyQuery.ID).toBe(1);
        expect(cluster.commands.identifyQuery.name).toBe('identifyQuery');
        expect(cluster.commandsResponse.identifyQueryRsp.ID).toBe(0);
        expect(cluster.commandsResponse.identifyQueryRsp.name).toBe('identifyQueryRsp');
    });

    it('Get cluster by ID', () => {
        const cluster1 = Zcl.Utils.getCluster(0);
        delete cluster1.getAttribute;
        delete cluster1.getCommand;
        delete cluster1.hasAttribute;
        delete cluster1.getCommandResponse;
        const cluster2 = Zcl.Utils.getCluster('genBasic');
        delete cluster2.getAttribute;
        delete cluster2.getCommand;
        delete cluster2.hasAttribute;
        delete cluster2.getCommandResponse;
        expect(cluster1).toStrictEqual(cluster2);
    });

    it('Get cluster attribute by ID', () => {
        const cluster = Zcl.Utils.getCluster(0);
        const attribute = cluster.getAttribute(1)
        expect(attribute).toStrictEqual({ID: 1, type: DataType.uint8, name: 'appVersion'});
    });

    it('Cluster has attribute', () => {
        const cluster = Zcl.Utils.getCluster(0);
        expect(cluster.hasAttribute('zclVersion')).toBeTruthy();
        expect(cluster.hasAttribute('NOTEXISTING')).toBeFalsy();
        expect(cluster.hasAttribute(0)).toBeTruthy();
        expect(cluster.hasAttribute(910293)).toBeFalsy();
    });

    it('Get specific command by name', () => {
        const cluster = Zcl.Utils.getCluster('genIdentify');
        const command = cluster.getCommand('ezmodeInvoke');
        expect(command.ID).toBe(2);
        expect(command.name).toBe('ezmodeInvoke');
    });

    it('Get global command by name', () => {
        const command = Zcl.Utils.getGlobalCommand('readRsp');
        expect(command.ID).toBe(1);
        expect(command.name).toBe('readRsp');
    });

    it('Get global command non existing', () => {
        expect(() => {
            Zcl.Utils.getGlobalCommand('nonexisting');
        }).toThrowError("Global command with key 'nonexisting' does not exist")
    });

    it('Get cluster by name non-existing', () => {
        expect(() => {
            Zcl.Utils.getCluster('notExisting');
        }).toThrowError("Cluster with key 'notExisting' does not exist")
    });

    it('Get specific command by ID', () => {
        const cluster = Zcl.Utils.getCluster('genIdentify');
        const command = cluster.getCommand(2);
        expect(command).toStrictEqual(cluster.getCommand('ezmodeInvoke'));
    });

    it('Get specific command by name server to client', () => {
        const cluster = Zcl.Utils.getCluster('genIdentify');
        const command = cluster.getCommandResponse(0);
        expect(command.ID).toBe(0);
        expect(command.name).toBe('identifyQueryRsp');
    });

    it('Get specific command by name non existing', () => {
        expect(() => {
            const cluster = Zcl.Utils.getCluster('genIdentify');
            cluster.getCommandResponse('nonexisting');
        }).toThrowError("Cluster 'genIdentify' has no command response 'nonexisting'")
    });

    it('Get discrete or analog of unkown type', () => {
        expect(() => {
            Zcl.Utils.IsDataTypeAnalogOrDiscrete(99999);
        }).toThrowError("Don't know value type for 'undefined'")
    });

    it('ZclFrame from buffer parse payload with unknown frame type', () => {
        expect(() => {
            // @ts-ignore
            Zcl.ZclFrame.parsePayload({frameControl: {frameType: 9}}, null);
        }).toThrowError("Unsupported frameType '9'")
    });

    it('ZclFrame from buffer report', () => {
        const buffer = [0x18, 0x4a, 0x0a, 0x55, 0x00, 0x39, 0x00, 0x00, 0x00, 0x00];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genAnalogInput").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 10,
            frameControl: {
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 74,
        };

        const payload = [{
            attrData: 0,
            attrId: 85,
            dataType: 57,
        }];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
        expect(frame.isGlobal()).toBe(true);
        expect(frame.isSpecific()).toBe(false);
        expect(frame.isCluster("genAnalogInput")).toBe(true);
        expect(frame.isCommand('report')).toBe(true);
    });

    it('ZclFrame from buffer tradfriArrowSingle', () => {
        const buffer = [0x05, 0x7c, 0x11, 0x1d, 0x07, 0x00, 0x01, 0x0d, 0x00];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genScenes").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 7,
            frameControl: {
                direction: 0,
                disableDefaultResponse: false,
                frameType: 1,
                manufacturerSpecific: true,
            },
            manufacturerCode: 4476,
            transactionSequenceNumber: 29,
        };

        const payload = {value: 256, value2: 13};

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
        expect(frame.getCommand().ID).toStrictEqual(7);
        expect(frame.getCommand().name).toStrictEqual('tradfriArrowSingle');
    });

    it('ZclFrame from buffer genGroups getMembership', () => {
        const buffer = [0x11, 0x7c, 0x02, 2, 10, 0, 20, 0];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genGroups").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 2,
            frameControl: {
                direction: 0,
                disableDefaultResponse: true,
                frameType: 1,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 124,
        };

        const payload = {groupcount: 2, grouplist: [10, 20]};

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer genGroups getMembership', () => {
        const buffer = [0x19, 0x7c, 0x03, 0, 10, 0];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genGroups").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 3,
            frameControl: {
                direction: 1,
                disableDefaultResponse: true,
                frameType: 1,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 124,
        };

        const payload = {groupid: 10, status: 0};

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer occupancy report', () => {
        const buffer = [24,169,10,0,0,24,1];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 10,
            frameControl: {
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 169,
        };

        const payload = [{ attrId: 0, dataType: 24, attrData: 1 }];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp', () => {
        const buffer = [0x08, 0x01, 0x07, 0x00];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genPowerCfg").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 7,
            frameControl: {
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{status: 0}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp failed', () => {
        const buffer = [0x08, 0x01, 0x07, 0x02, 0x01, 0x01, 0x01];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genPowerCfg").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 7,
            frameControl: {
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{status: 2, direction: 1, attrId: 257}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer defaultRsp', () => {
        const buffer = [0x18, 0x04, 0x0b, 0x0c, 0x82];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 11,
            frameControl: {
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 4,
        };

        const payload = {cmdId: 12, statusCode: 130};

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer xiaomiStruct', () => {
        const buffer = [28,95,17,3,10,5,0,66,21,108,117,109,105,46,115,101,110,115,111,114,95,119,108,101,97,107,46,97,113,49,1,255,66,34,1,33,213,12,3,40,33,4,33,168,19,5,33,43,0,6,36,0,0,5,0,0,8,33,4,2,10,33,0,0,100,16,0];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 10,
            frameControl: {
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: true,
            },
            manufacturerCode: 4447,
            transactionSequenceNumber: 3,
        };

        const payload = [{"attrId":5,"dataType":66,"attrData":"lumi.sensor_wleak.aq1"},{"attrId":65281,"dataType":66,"attrData":{"1":3285,"3":33,"4":5032,"5":43,"6":[0,327680],"8":516,"10":0,"100":0}}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer struct', () => {
        const buffer = [28,52,18,194,10,2,255,76,6,0,16,1,33,206,11,33,168,67,36,1,0,0,0,0,33,48,2,32,86];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 10,
            frameControl: {
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: true,
            },
            manufacturerCode: 4660,
            transactionSequenceNumber: 194,
        };

        const payload = [
            {
                "attrId":65282,
                "dataType":76,
                "numElms":6,
                "structElms":[
                    {"elmType":16,"elmVal":1},
                    {"elmType":33,"elmVal":3022},
                    {"elmType":33,"elmVal":17320},
                    {"elmType":36,"elmVal":[0,1]},
                    {"elmType":33,"elmVal":560},
                    {"elmType":32,"elmVal":86},
                ],
                "attrData":[
                    {"elmType":16,"elmVal":1},
                    {"elmType":33,"elmVal":3022},
                    {"elmType":33,"elmVal":17320},
                    {"elmType":36,"elmVal":[0,1]},
                    {"elmType":33,"elmVal":560},
                    {"elmType":32,"elmVal":86}
                ]
            }
        ];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer discoverRsp', () => {
        const buffer = [24,23,13,0,32,0,32,33,0,32,49,0,48,51,0,32,53,0,24];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genPowerCfg").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 13,
            frameControl: {
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 23,
        };

        const payload = {"discComplete":0,"attrInfos":[{"attrId":32,"dataType":32},{"attrId":33,"dataType":32},{"attrId":49,"dataType":48},{"attrId":51,"dataType":32},{"attrId":53,"dataType":24}]};

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
        expect(frame.Cluster.name).toEqual('genPowerCfg');
        expect(frame.getCommand().name).toEqual('discoverRsp');
    });

    it('ZclFrame from buffer error on malformed', () => {
        const buffer = [0x08, 0x01];
        expect(() => {
            Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genPowerCfg").ID, Buffer.from(buffer));
        }).toThrowError("ZclFrame length is lower than minimal length");
    });

    it('ZclFrame from buffer readRsp failed', () => {
        const buffer = [8, 1, 1, 1, 0, 2];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 1,
            frameControl: {
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{status: 2, attrId: 1}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer readRsp success', () => {
        const buffer = [8, 1, 1, 1, 0, 0, 32, 3];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 1,
            frameControl: {
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{status: Zcl.Status.SUCCESS, attrId: 1, dataType: Zcl.DataType.uint8, attrData: 3}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer readRsp alias type', () => {
        const buffer = [8, 1, 1, 1, 0, 0, 8, 3];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 1,
            frameControl: {
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{status: Zcl.Status.SUCCESS, attrId: 1, dataType: Zcl.DataType.data8, attrData: 3}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp server to client', () => {
        const buffer = [8, 1, 6, 1, 1, 0, 10, 10];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 6,
            frameControl: {
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{attrId: 1, direction: 1, timeout: 2570}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp client to server analog', () => {
        const buffer = [8, 1, 6, 0, 0, 1, 32, 1, 0, 10, 0, 20];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 6,
            frameControl: {
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{attrId: 256, dataType: 32, direction: 0, maxRepIntval: 10, minRepIntval: 1, repChange: 20,}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp client to server analog', () => {
        const buffer = [8, 1, 6, 0, 0, 1, 8, 1, 0, 10, 0];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 6,
            frameControl: {
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{attrId: 256, dataType: 8, direction: 0, maxRepIntval: 10, minRepIntval: 1}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer readRsp', () => {
        const buffer = [24,7,1,5,0,0,66,30,84,82,65,68,70,82,73,32,98,117,108,98,32,69,50,55,32,87,83,32,111,112,97,108,32,57,56,48,108,109,6,0,0,66,8,50,48,49,55,48,51,51,49,7,0,0,48,1,10,0,0,65,15,76,69,68,49,53,52,53,71,49,50,69,50,55,69,85];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 1,
            frameControl: {
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 7,
        };

        const payload = [{"attrId":5,"status":0,"dataType":66,"attrData":"TRADFRI bulb E27 WS opal 980lm"},{"attrId":6,"status":0,"dataType":66,"attrData":"20170331"},{"attrId":7,"status":0,"dataType":48,"attrData":1},{"attrId":10,"status":0,"dataType":65,"attrData":Buffer.from([76,69,68,49,53,52,53,71,49,50,69,50,55,69,85])}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame with Ubisys (manufacturer specific) cluster create', () => {
        const payload = [{attrId: 0x0000, status: 0, attrData: 1, dataType: 32}];
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, false, 0x10f2, 8, 'readRsp', 0xfc00, payload
        );

        expect(frame.Cluster.name).toBe('manuSpecificUbisysDeviceSetup');
    });

    it('ZclFrame with Ubisys (manufacturer specific) cluster create with non Ubisys manufcode', () => {
        const payload = [{attrId: 0x0000, status: 0, attrData: 1, dataType: 32}];
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, false, 0x10f3, 8, 'readRsp', 0xfc00, payload
        );

        expect(frame.Cluster.name).toBe('manuSpecificPhilips');
    });

    it('ZclFrame with Ubisys (manufacturer specific) cluster fromBuffer', () => {
        const buffer = Buffer.from([0x04, 0xf2, 0x10, 0x08, 0x01, 0x00, 0x00, 0x00, 0x20, 0x01])
        const frame = Zcl.ZclFrame.fromBuffer(0xfc00, buffer);
        expect(frame.Cluster.name).toBe('manuSpecificUbisysDeviceSetup');
    });

    it('ZclFrame to buffer discover', () => {
        const expected = Buffer.from([0,8,12,0,0,240]);
        const payload = {startAttrId: 0, maxAttrIds: 240};
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, false, null, 8, 'discover', 0, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer readRsp UTC', () => {
        const expected = Buffer.from([24,74,1,0,0,0,226,234,83,218,36]);
        const payload = [{attrId: 0, status: 0, attrData: 618288106, dataType: 226}];
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, null, 74, 'readRsp', 0, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame write request with string as bytes array', () => {
        const payload = [{attrId: 0x0401, attrData: [0x07, 0x00, 0x02, 0x01, 0x00, 0x00, 0x00, 0x14], dataType: 0x42}];
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, 0x115f, 15, 'write', 0, payload
        );

        const expected = [0x14, 0x5f, 0x11, 0x0f, 0x02, 0x01, 0x04, 0x42, 0x07, 0x00, 0x02, 0x01, 0x00, 0x00, 0x00, 0x14];
        expect(Buffer.from(expected)).toStrictEqual(frame.toBuffer());
    });

    //{ frameType: 0, manufSpec: 0, direction: 0, disDefaultRsp: 0 } 0 8 'discover' { startAttrId: 0, maxAttrIds: 240 }
    it('ZclFrame to buffer readRsp success', () => {
        const expected = Buffer.from([8, 1, 1, 1, 0, 0, 32, 3]);
        const payload = [{status: Zcl.Status.SUCCESS, attrId: 1, dataType: Zcl.DataType.uint8, attrData: 3}];
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, false, null, 1, 1, 0, payload,
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer defaultRsp success', () => {
        const expected = Buffer.from([0x18, 0x04, 0x0b, 0x0c, 0x82]);
        const payload = {cmdId: 12, statusCode: 130};
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, null, 4, 11, 0, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer discoverRsp', () => {
        const expected = Buffer.from([24,23,13,0,32,0,32,33,0,32,49,0,48,51,0,32,53,0,24]);
        const payload = {"discComplete":0,"attrInfos":[{"attrId":32,"dataType":32},{"attrId":33,"dataType":32},{"attrId":49,"dataType":48},{"attrId":51,"dataType":32},{"attrId":53,"dataType":24}]};

        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, null, 23, 13, 0, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer tradfriArrowSingle', () => {
        const expected = Buffer.from([0x05, 0x7c, 0x11, 0x1d, 0x07, 0x00, 0x01, 0x0d, 0x00]);
        const payload = {value: 256, value2: 13};

        const frame = Zcl.ZclFrame.create(
            FrameType.SPECIFIC, Direction.CLIENT_TO_SERVER, false, 4476, 29, 7, 5, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer readRsp failed', () => {
        const expected = Buffer.from([8, 1, 1, 1, 0, 2]);
        const payload = [{status: 2, attrId: 1}];

        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, false, null, 1, 1, 0, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer offWithEffect', () => {
        const expected = Buffer.from([0x1, 1, 64, 1, 0]);
        const payload = {effectid: 1, effectvariant: 0};

        const frame = Zcl.ZclFrame.create(
            FrameType.SPECIFIC, Direction.CLIENT_TO_SERVER, false, null, 1, 64, 6, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer offWithEffect', () => {
        const expected = Buffer.from([9, 9, 0, 1]);

        const frame = Zcl.ZclFrame.create(
            FrameType.SPECIFIC, Direction.SERVER_TO_CLIENT, false, null, 9, 'restartDeviceRsp', 21, {status: 1}
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer invalid frametype', () => {
        expect(() => {
            Zcl.ZclFrame.create(
                3, Direction.CLIENT_TO_SERVER, false, null, 1, 64, 6, {},
            ).toBuffer();
        }).toThrowError("Frametype '3' not valid");
    });

    it('BuffaloZcl read array', () => {
        const buffer = Buffer.from([32, 3, 0, 1, 2, 3]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType[DataType.array], {});
        expect(buffalo.getPosition()).toBe(6);
        expect(value).toStrictEqual([1, 2, 3]);
    });

    it('BuffaloZcl read struct', () => {
        const buffer = Buffer.from([0, 2, 0, 32, 8, 33, 4, 0]);
        const buffalo = new BuffaloZcl(buffer, 1);
        const value = buffalo.read(DataType[DataType.struct], {});
        expect(buffalo.getPosition()).toBe(8);
        expect(value).toStrictEqual([{"elmType": 32, "elmVal": 8}, {"elmType": 33, "elmVal": 4}]);
    });

    it('BuffaloZcl read longCharStr', () => {
        const buffer = Buffer.from([5, 0, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType[DataType.longCharStr], {});
        expect(buffalo.getPosition()).toBe(7);
        expect(value).toStrictEqual('hello');
    });

    it('BuffaloZcl read extensionFieldSets', () => {
        const buffer = Buffer.from([5, 0, 3, 1, 2, 3]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(BuffaloZclDataType[BuffaloZclDataType.EXTENSION_FIELD_SETS], {});
        expect(buffalo.getPosition()).toBe(6);
        expect(value).toStrictEqual([{clstId: 5, len: 3, extField: [1, 2, 3]}]);
    });

    it('BuffaloZcl read list zoneinfo', () => {
        const buffer = Buffer.from([1, 5, 0, 2, 6, 0]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(BuffaloZclDataType[BuffaloZclDataType.LIST_ZONEINFO], {length: 2});
        expect(buffalo.getPosition()).toBe(6);
        expect(value).toStrictEqual([{zoneID: 1, zoneStatus: 5}, {zoneID: 2, zoneStatus: 6}]);
    });

    it('BuffaloZcl read uint48', () => {
        const buffer = Buffer.from([1, 5, 4, 5, 6, 7]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType[DataType.uint48], {});
        expect(buffalo.getPosition()).toBe(6);
        expect(value).toStrictEqual([1798, 84149505]);
    });

    it('BuffaloZcl read uint56', () => {
        const buffer = Buffer.from([1, 5, 4, 5, 6, 7, 7]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType[DataType.uint56], {});
        expect(buffalo.getPosition()).toBe(7);
        expect(value).toStrictEqual([7, 1798, 84149505]);
    });

    it('BuffaloZcl read uint64', () => {
        const buffer = Buffer.from([1, 5, 4, 5, 6, 7, 7, 9]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType[DataType.uint64], {});
        expect(buffalo.getPosition()).toBe(8);
        expect(value).toStrictEqual("0x0907070605040501");
    });

    it('BuffaloZcl write charStr', () => {
        const payload = 'hello';
        const buffer = Buffer.alloc(7);
        const expected = Buffer.from([5, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType[DataType.charStr], payload, {});
        expect(buffalo.getPosition()).toBe(6);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write longCharStr', () => {
        const payload = 'hello';
        const buffer = Buffer.alloc(7);
        const expected = Buffer.from([5, 0, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
        const buffalo = new BuffaloZcl(buffer);
        const result = buffalo.write(DataType[DataType.longCharStr], payload, {});
        expect(buffalo.getPosition()).toBe(7);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write extensionFieldSets', () => {
        const payload = [{clstId: 5, len: 3, extField: [1, 2, 3]}];
        const buffer = Buffer.alloc(6);
        const expected = Buffer.from([5, 0, 3, 1, 2, 3]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(BuffaloZclDataType[BuffaloZclDataType.EXTENSION_FIELD_SETS], payload, {});
        expect(buffalo.getPosition()).toBe(6);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write zoneinfo', () => {
        const payload = [{zoneID: 1, zoneStatus: 5}, {zoneID: 2, zoneStatus: 6}];
        const buffer = Buffer.alloc(6);
        const expected = Buffer.from([1, 5, 0, 2, 6, 0]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(BuffaloZclDataType[BuffaloZclDataType.LIST_ZONEINFO], payload, {});
        expect(buffalo.getPosition()).toBe(6);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write uint40', () => {
        const payload = [30, 40];
        const buffer = Buffer.alloc(5);
        const expected = Buffer.from([40, 0, 0, 0, 30]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType[DataType.uint40], payload, {});
        expect(buffalo.getPosition()).toBe(5);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write uint48', () => {
        const payload = [1798, 84149505];
        const buffer = Buffer.alloc(6);
        const expected = Buffer.from([1, 5, 4, 5, 6, 7]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType[DataType.uint48], payload, {});
        expect(buffalo.getPosition()).toBe(6);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write uint56', () => {
        const payload = [7, 1798, 84149505];
        const buffer = Buffer.alloc(7);
        const expected = Buffer.from([6, 7, 0, 0, 7, 0, 0]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType[DataType.uint56], payload, {});
        expect(buffalo.getPosition()).toBe(7);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write uint64', () => {
        const payload = "0x0907070605040501";
        const buffer = Buffer.alloc(8);
        const expected = Buffer.from([1, 5, 4, 5, 6, 7, 7, 9]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType[DataType.uint64], payload, {});
        expect(buffalo.getPosition()).toBe(8);
        expect(buffer).toStrictEqual(expected);
    });

    it('Zcl utils get cluster without manufacturerCode', () => {
        const cluster = Zcl.Utils.getCluster(0xfc00);
        expect(cluster.ID).toBe(0xfc00);
        expect(cluster.name).toBe('manuSpecificPhilips');
    });

    it('Zcl utils get cluster manufacturerCode', () => {
        const cluster = Zcl.Utils.getCluster(0xfc00, 0x10f2);
        expect(cluster.ID).toBe(0xfc00);
        expect(cluster.name).toBe('manuSpecificUbisysDeviceSetup');
    });

    it('Zcl utils get cluster manufacturerCode wrong', () => {
        const cluster = Zcl.Utils.getCluster(0xfc00, 123);
        expect(cluster.ID).toBe(0xfc00);
        expect(cluster.name).toBe('manuSpecificPhilips');
    });

    it('Zcl utils get cluster attributes manufacturerCode', () => {
        const cluster = Zcl.Utils.getCluster('closuresWindowCovering', 0x10f2);
        const attribute = cluster.getAttribute(0x1000);
        expect(attribute).toStrictEqual({"ID": 4096, "manufacturerCode": 4338, "name": "ubisysTurnaroundGuardTime", "type": 32});
    });

    it('Zcl utils get cluster attributes manufacturerCode wrong (should get it even tough manufacturerCode mismatches)', () => {
        const cluster = Zcl.Utils.getCluster('closuresWindowCovering', 123);
        const attribute = cluster.getAttribute(0x1000);
        expect(attribute).toStrictEqual({"ID": 4096, "manufacturerCode": 4338, "name": "ubisysTurnaroundGuardTime", "type": 32});
    });

    it('Zcl utils get command', () => {
        const cluster = Zcl.Utils.getCluster('genOnOff');
        const command = cluster.getCommand(0);
        expect(command.name).toEqual('off');
        expect(cluster.getCommand('off')).toEqual(command);
    });

    it('Zcl utils get attribute', () => {
        const cluster = Zcl.Utils.getCluster('genOnOff');
        const command = cluster.getAttribute(16385);
        expect(command.name).toEqual('onTime');
        expect(cluster.getAttribute('onTime')).toEqual(command);
    });

    it('Zcl utils get attribute non-existing', () => {
        const cluster = Zcl.Utils.getCluster('genOnOff');
        expect(() => cluster.getAttribute('notExisting'))
            .toThrowError("Cluster 'genOnOff' has no attribute 'notExisting'");
    });

    it('Zcl utils get command non-existing', () => {
        const cluster = Zcl.Utils.getCluster('genOnOff');
        expect(() => cluster.getCommand('notExisting'))
            .toThrowError("Cluster 'genOnOff' has no command 'notExisting'");
    });
});