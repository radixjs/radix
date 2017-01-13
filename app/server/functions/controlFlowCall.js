function controlFlowCall(controlFlow) {
    let next = (iter, cb, ecb, prev = undefined) => {
        const item = iter.next(prev);
        const value = item.value;

        if (item.done) return cb(prev);

        if (isPromise(value)) {
            value.then(val => {
                try {
                    setImmediate(() => next(iter, cb, ecb, val));
                } catch (e) {
                    ecb(e);
                }
            }).catch(error => {
                ecb(error);
            });
        } else if (Array.isArray(value) && value.length > 0 && isPromise(value[0])) {
            Promise.all(value).then(val => {
                try {
                    setImmediate(() => next(iter, cb, ecb, val));
                } catch (e) {
                    ecb(e);
                }
            }).catch(error => {
                ecb(error);
            });
        } else {
            try {
                setImmediate(() => next(iter, cb, ecb, value));
            } catch (e) {
                ecb(e);
            }
        }
    };
    return (...args) => (new Promise((resolve, reject) => {
        let potentialIterator = controlFlow(...args);
        if (potentialIterator && potentialIterator.next && typeof potentialIterator.next === "function") {
            next(potentialIterator, val => resolve(val), val => {
                reject(val)
            });
        } else {
            try {
                resolve(potentialIterator);
            } catch (e) {
                console.log("\033[37m asd" + e + "\033[0m");
            }
        }
    })).catch(e => {
        if(stack.globals.WORKER){
            console.log(stack.helpers.colors.RED + "Error");
            console.log(e.toString());
            console.log(stack.helpers.colors.RESET);
            stack.globals.WORKER.kill();
        }
    });

}