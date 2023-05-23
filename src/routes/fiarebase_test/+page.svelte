<script lang="ts">
    import { firebase_config } from '../../firebase-config';
    import { initializeApp } from 'firebase/app';
    import { addDoc, collection, getDocs, getFirestore, doc, Firestore, onSnapshot } from 'firebase/firestore';
    import { onDestroy } from 'svelte';

    let app = initializeApp(firebase_config);
    let db: Firestore = getFirestore(app);
    let text = "yoyo";
    let unsub = onSnapshot(doc(db, 'songs/thisone'), (doc) => {
        console.log(doc.data())
        text = doc.data()?.yaaaaah;
    });
    onDestroy(unsub);
    (async () => {
        let messages = await getDocs(collection(db, 'messages'));
        // messages.forEach(d => {
        //     console.log(d.id, d.data())
        // });

        // await addDoc(collection(db, 'songs'), {
        //     ids: ['lil', 'some']
        // });

        let songs = await getDocs(collection(db, 'songs'));
        songs.forEach(d => {
            console.log(d.data());
        });
    })();
</script>

<span>{text}</span>
