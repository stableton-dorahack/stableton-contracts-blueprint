import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type OracleConfig = {
    owner: Address;
    price: number;
};

export function oracleConfigToCell(config: OracleConfig): Cell {
    return beginCell().storeAddress(config.owner).storeUint(config.price, 32).endCell();
}

export const Opcodes = {
    update_price: 1,
    read_price: 2,
};

export class Oracle implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Oracle(address);
    }

    static createFromConfig(config: OracleConfig, code: Cell, workchain = 0) {
        const data = oracleConfigToCell(config);
        const init = { code, data };
        return new Oracle(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell().endCell(),
        });
    }

    async sendUpdatePrice(
        provider: ContractProvider,
        via: Sender,
        opts: {
            new_price: number;
            value: bigint;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell()
                .storeUint(Opcodes.update_price, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeUint(opts.new_price, 32)
                .endCell(),
        });
    }

    async getPrice(provider: ContractProvider) {
        const result = await provider.get('get_price', []);
        return result.stack.readNumber();
    }

    async getOwner(provider: ContractProvider) {
        const result = await provider.get('get_owner', []);
        return result.stack.readAddress();
    }
}
