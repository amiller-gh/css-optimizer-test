"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const csssize = require("css-size");
const postcss = require("postcss");
const atomic_1 = require("../src/atomic");
fs.readFile('./fixtures/linkedin.css', (err, css) => {
    if (err) {
        throw err;
    }
    function process(css) {
        let res = postcss([atomic_1.default]).process(css);
        res.then((res) => {
            console.log('done', res.css);
        });
        return res;
    }
    csssize.table(css, {}, process).then(function (table) {
        console.log(table);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXRvbWljLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdGVzdC9hdG9taWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5QkFBeUI7QUFDekIsb0NBQW9DO0FBQ3BDLG1DQUFtQztBQUVuQywwQ0FBbUM7QUFFbkMsRUFBRSxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSxDQUFDLEdBQVUsRUFBRSxHQUFXO0lBRTdELEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDUixNQUFNLEdBQUcsQ0FBQztJQUNaLENBQUM7SUFFRCxpQkFBaUIsR0FBVztRQUMxQixJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsQ0FBQyxnQkFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDekMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQW1CO1lBQzVCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRUQsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQWE7UUFDMUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgY3Nzc2l6ZSBmcm9tICdjc3Mtc2l6ZSc7XG5pbXBvcnQgKiBhcyBwb3N0Y3NzIGZyb20gJ3Bvc3Rjc3MnO1xuXG5pbXBvcnQgYXRvbWljIGZyb20gJy4uL3NyYy9hdG9taWMnO1xuXG5mcy5yZWFkRmlsZSgnLi9maXh0dXJlcy9saW5rZWRpbi5jc3MnLCAoZXJyOiBFcnJvciwgY3NzOiBCdWZmZXIpID0+IHtcblxuICBpZiAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJvY2Vzcyhjc3M6IHN0cmluZyk6IHBvc3Rjc3MuTGF6eVJlc3VsdHtcbiAgICBsZXQgcmVzID0gcG9zdGNzcyhbYXRvbWljXSkucHJvY2Vzcyhjc3MpO1xuICAgIHJlcy50aGVuKChyZXM6IHBvc3Rjc3MuUmVzdWx0KSA9PiB7XG4gICAgIGNvbnNvbGUubG9nKCdkb25lJywgcmVzLmNzcyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIGNzc3NpemUudGFibGUoY3NzLCB7fSwgcHJvY2VzcykudGhlbihmdW5jdGlvbiAodGFibGU6IHN0cmluZykge1xuICAgIGNvbnNvbGUubG9nKHRhYmxlKTtcbiAgfSk7XG59KTtcbiJdfQ==