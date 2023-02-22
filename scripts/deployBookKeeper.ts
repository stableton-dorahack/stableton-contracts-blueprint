import { toNano } from 'ton-core';
import { BookKeeper } from '../wrappers/BookKeeper';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const bookKeeper = BookKeeper.createFromConfig(
        {
            id: Math.floor(Math.random() * 10000),
            counter: 0,
        },
        await compile('BookKeeper')
    );

    await provider.deploy(bookKeeper, toNano('0.05'));

    const openedContract = provider.open(bookKeeper);

    console.log('ID', await openedContract.getID());
}
