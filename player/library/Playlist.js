export default class Playlist {
    constructor(name, image = '', tracks = []) {
        this.name = name;
        this.tracks = tracks;
        this.image = image;
        this.id = undefined;
        this.canvas = document.createElement('canvas');
        //album covers are 1200 pixels wide
        this.canvas.width = this.canvas.height = 1200;
        this.hasImage = false;
        this.createImage();
    }

    createImage() {
        let ctx = this.canvas.getContext('2d'),
            cw = this.canvas.width;
        ctx.fillStyle = '#080c0c';
        ctx.fillRect(0, 0, cw, cw);

        if (this.image) {
            let img = document.createElement('img');
            img.src = this.image;
            img.onload = () => {
                this.drawOntoCanvas(ctx, img, cw);
                this.hasImage = true;
            };
        } else {
            if (this.tracks) {
                let uniques = this.tracks.reduce((prev, current) => {
                    return prev.findIndex((i) => i.album == current.album) == -1
                        ? [...prev, current]
                        : prev;
                }, []);
                this.loadAll(
                    uniques.slice(0, 4).map((i) => i.album.image),
                    (images) => this.fancyAlbumCover(ctx, cw, images)
                    /*uniques.map((i) => i.album.image),
                    (images) => this.fancierAlbumCover(ctx, cw, images)*/
                );
            }
        }
    }

    dirty() {
        this.hasImage = false;
        this.createImage();
    }

    /**
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLImageElement} img
     * @param {Number} cw
     * @param {Number} scalingFactor
     * @param {Number[]} offset
     */
    drawOntoCanvas(ctx, img, cw, scalingFactor = 1, offset = [0, 0]) {
        let w = img.width,
            h = img.height,
            ratio = h / w;
        if (ratio > 1) {
            let scale = (scalingFactor * cw) / h;
            ctx.drawImage(
                img,
                offset[0] * cw + (h - w) / 2,
                offset[1] * cw,
                w * scale,
                h * scale
            );
        } else {
            let scale = (scalingFactor * cw) / w;
            ctx.drawImage(
                img,
                offset[0] * cw,
                offset[1] * cw + (w - h) / 2,
                w * scale,
                h * scale
            );
        }
    }

    /**
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {Number} cw
     * @param {HTMLImageElement[]} images
     * @returns
     */
    fancyAlbumCover(ctx, cw, images) {
        if (images.length == 1) {
            this.drawOntoCanvas(ctx, images[0], cw);
            return;
        }

        ctx.globalAlpha = 0.4;
        this.drawOntoCanvas(ctx, images[0], cw);
        ctx.globalAlpha = 1.0;

        let offsets = [
            [0, 0],
            [0.5, 0.5],
            [0.5, 0],
            [0, 0.5],
        ];
        while (images.length > 0) {
            this.drawOntoCanvas(ctx, images.shift(), cw, 0.5, offsets.shift());
        }
    }

    fancierAlbumCover(ctx, cw, images) {
        ctx.globalAlpha = 0.4;
        this.drawOntoCanvas(ctx, images[0], cw);
        ctx.globalAlpha = 1.0;

        function getOffsets(n) {
            let offsets = [],
                s = Math.ceil(Math.sqrt(n));
            if (s % 2 == 1) {
                for (let i = 0; i < s ** 2; i += 2) {
                    offsets.push([(i % s) / s, ((i / s) | 0) / s]);
                }
                for (let i = 1; i < n; i += 2) {
                    offsets.push([(i % s) / s, ((i / s) | 0) / s]);
                }
            } else {
                for (let i = 0; i < s ** 2; i += 2) {
                    let o = (i / s) | 0;
                    offsets.push([((i % s) + (o % 2)) / s, o / s]);
                }
                for (let i = 1; i < n; i += 2) {
                    let o = (i / s) | 0;
                    offsets.push([((i % s) + (o % 2)) / s, o / s]);
                }
            }
            return offsets;
        }

        let n = images.length,
            offsets = getOffsets(n);
        while (images.length > 0) {
            this.drawOntoCanvas(
                ctx,
                images.shift(),
                cw,
                1 / Math.ceil(Math.sqrt(n)),
                offsets.shift()
            );
        }
    }

    /**
     *
     * @param {String[]} links
     * @param {Function} callback
     */
    loadAll(links, callback) {
        let num = links.length,
            loaded = 0,
            /**
             * @type {HTMLImageElement[]}
             */
            images = [];

        function onload() {
            loaded++;
            if (loaded == num) {
                callback(images);
            }
        }

        for (let i of links) {
            let img = document.createElement('img');
            img.src = i;
            img.onload = onload;
            images.push(img);
        }
    }
}
