import { Blockchain } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Oracle } from '../wrappers/Oracle';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe.only('Oracle', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Oracle');
    });

    it('should deploy', async () => {
        const blockchain = await Blockchain.create();

        const deployer = await blockchain.treasury('deployer');

        const oracle = blockchain.openContract(
            Oracle.createFromConfig(
                {
                    owner: deployer.address,
                    price: 0,
                },
                code
            )
        );

        const deployResult = await oracle.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: oracle.address,
            deploy: true,
        });
    });

    it('should set price sent by owner', async () => {
        const blockchain = await Blockchain.create();

        const deployer = await blockchain.treasury('deployer');

        const oracle = blockchain.openContract(
            Oracle.createFromConfig(
                {
                    owner: deployer.address,
                    price: 0,
                },
                code
            )
        );

        const deployResult = await oracle.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: oracle.address,
            deploy: true,
        });

        const priceBefore = await oracle.getPrice();

        console.log('price before increasing', priceBefore);

        const newPrice = Math.floor(Math.random() * 1e6);

        console.log('newPrice to set', newPrice);

        const updateResult = await oracle.sendUpdatePrice(deployer.getSender(), {
            new_price: newPrice,
            value: toNano('0.05'),
        });

        expect(updateResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: oracle.address,
            success: true,
        });

        const priceAfter = await oracle.getPrice();

        console.log('price after increasing', priceAfter);

        expect(priceAfter).toBe(newPrice);
    });

    it('should throw if set not by owner', async () => {
        const blockchain = await Blockchain.create();

        const deployer = await blockchain.treasury('deployer');

        const oracle = blockchain.openContract(
            Oracle.createFromConfig(
                {
                    owner: deployer.address,
                    price: 0,
                },
                code
            )
        );

        const deployResult = await oracle.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: oracle.address,
            deploy: true,
        });

        const increaser = await blockchain.treasury('increaser');

        const priceBefore = await oracle.getPrice();

        console.log('price before increasing', priceBefore);

        const newPrice = Math.floor(Math.random() * 1e6);

        console.log('newPrice to set', newPrice);

        const updateResult = await oracle.sendUpdatePrice(increaser.getSender(), {
            new_price: newPrice,
            value: toNano('0.05'),
        });

        expect(updateResult.transactions).toHaveTransaction({
            from: increaser.address,
            to: oracle.address,
            success: false,
        });

        const priceAfter = await oracle.getPrice();

        console.log('price after increasing', priceAfter);

        expect(priceAfter).toBe(priceBefore);
    });
});
