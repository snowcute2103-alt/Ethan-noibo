export interface RotatePuzzleLevel {
  id: string;
  /** Hiển thị trong danh sách chọn màn (tương đương thuộc tính `data-blurb` bản gốc). */
  listBlurb: string;
  instruction?: string;
  /** Lưới ASCII của màn, giữ nguyên khoảng trắng đầu dòng (quyết định vị trí peg trên lưới). */
  maze: string;
}

export const ROTATE_PUZZLE_LEVELS: RotatePuzzleLevel[] = [
  {
    id: 'intro-fixed1',
    listBlurb: 'Hướng dẫn',
    instruction: 'Kéo gấu con đến ngôi sao',
    maze: `*=.=.
    !
. . .
    !
@=.=.
`,
  },
  {
    id: 'intro-fixed2',
    listBlurb: 'Hướng dẫn',
    instruction: 'Kéo lưới để xoay. Gấu con và ngôi sao xoay theo lưới. Đường nối màu cam đứng yên tại chỗ.',
    maze: `* . .
    !
. . .
    !
@=.=.
`,
  },
  {
    id: 'intro-fixed3',
    listBlurb: '★',
    maze: `@=. .

. . .
    !
*=. .
`,
  },
  {
    id: 'intro-free1',
    listBlurb: 'Hướng dẫn',
    instruction: 'Đường nối màu xanh di chuyển theo lưới. Xoay lưới để nối đường xanh với đường cam theo nhiều cách khác nhau.',
    maze: `@-. .
!   |
. . .
    |
*-.-.
`,
  },
  {
    id: 'm3x3-2-med',
    listBlurb: '★',
    maze: `. . *
| | |
. . .
| | |
@ .=.
`,
  },
  {
    id: 'm3x3-fixed-switch',
    listBlurb: '★',
    maze: `*=.-.

. . .
    |
@-. .
`,
  },
  {
    id: 'm4x4-2',
    listBlurb: '★',
    maze: `. .=. .
  | !
. . .-*
  |
. . . .

. @-. .
`,
  },
  {
    id: 'm4x4-1',
    listBlurb: '★',
    maze: `. . . .

* . . @
  | ! |
. . . .
  !
. . . .
`,
  },
  {
    id: 'm4x4-3',
    listBlurb: '★',
    maze: `. @ . .
! |
. . . .
      |
.=.=.-.
|
. * . .
`,
  },
  {
    id: 'm4x4-4',
    listBlurb: '★',
    maze: `. . . .

* . . .
    !
. . .-.
!
.=.=. @
`,
  },
  {
    id: 'm4x4-5',
    listBlurb: '★',
    maze: `.-.-.-.
|
@ .-.-.

* .=. .
!   |
.-.-. .
`,
  },
  {
    id: 'm4x4-6-med',
    listBlurb: '★',
    maze: `. * . .

.-.=. .
  |
. . . .
!   |
.=. @ .
`,
  },
  {
    id: 'm4x4-7-hard1',
    listBlurb: '★★',
    maze: `. . *-.

.-.=. .
      |
.=. . .
  | |
@-.-.=.
`,
  },
  {
    id: 'm4x4-8-hard2',
    listBlurb: '★★',
    maze: `.-@ .=.

. . . .
    |
.-. .-*
  |
. .=.-.
`,
  },
  {
    id: 'm4x4-9-hard1',
    listBlurb: '★★',
    maze: `. . .=.
  !
@-. .-.

. .=. .

. . * .
`,
  },
  {
    id: 'm4x4-10-hard1',
    listBlurb: '★★',
    maze: `. @=. .
  |
. .-.-.

.-.-.-.
!     !
. * . .
`,
  },
  {
    id: 'm5x5-3',
    listBlurb: '★',
    maze: `. . . . .
  | !
. . .-. .
  |
. . . . *
  |
. . .=. .
  |
. @ . . .
`,
  },
  {
    id: 'm5x5-1',
    listBlurb: '★',
    maze: `@-.-. .-.
    |
. . . . .

. . .=. .

. . . .=.
    |
. .=.-* .
`,
  },
  {
    id: 'm5x5-2',
    listBlurb: '★★',
    maze: `. . . . .

. .=.-. @
|       !
. . . .-.

.=. . .=.
!
* . . . .
`,
  },
  {
    id: 'm5x5-4',
    listBlurb: '★★',
    maze: `. . . .-.
      !
. .-. . .
  !     |
.=. . . .
|
. . . . *
|
.-@=. .=.
`,
  },
  {
    id: 'm5x5-5',
    listBlurb: '★★',
    maze: `. . . . .

. . .-. *
    !
. . .-. .

.=. . . .
    |
. @-. . .
`,
  },
  {
    id: 'm5x5-6',
    listBlurb: '★★',
    maze: `. . .-.-.
!   !
. .=.-. .
|
. .-. .-@
!
* .=. . .
      |
.=. .-.=.
`,
  },
  {
    id: 'm5x5-7',
    listBlurb: '★★★',
    maze: `.=* . @=.
|
. .=. . .
|   | |
.=. . .-.
        |
. . . .=.
!
. .-.-. .
`,
  },
  {
    id: 'm5x5-8',
    listBlurb: '★★★',
    maze: `. * . .-.
  |
. . .=.-.
!       |
. . . . .

. .-. .=.
        |
. . .=.-@
`,
  },
  {
    id: 'm5x5-9',
    listBlurb: '★★★',
    maze: `.-.-. . .
    |
. . . .-@
  !
* . .-. .
|   !
.-. . .=.
    |   !
. . .=. .
`,
  },
  {
    id: 'm5x5-10',
    listBlurb: '★★',
    maze: `. . . . .

. . . .-@
  !
* . .=. .
|   !
.-. . . .

. . . . .
`,
  },
  {
    id: 'm5x5-11',
    listBlurb: '★★★',
    maze: `. . . .=.
  |
. . . .=.
|
. . .-. .
! |
. .=. . .
|   !   !
.-@ . * .
`,
  },
  {
    id: 'm5x5-12',
    listBlurb: '★★',
    maze: `. . .=.=.

. . . . .

. . . . @

. . . . .

* . .=.=.
`,
  },
  {
    id: 'm6x6-1-hard1',
    listBlurb: '★★★',
    maze: `. . * . . .
  ! | |
. .-. .-. .
          |
. . . . .-.
      | ! |
. . .=. . .
    |
@-.-. .-. .
          |
. .=. . .-.
`,
  },
  {
    id: 'm6x6-2',
    listBlurb: '★★★',
    maze: `@ .=. . .=.
  | | !
. . . .=. .
  |     |
. . . .-. .
|   !
. . . . . *
|     |
.=. .-. . .
  |   | |
.-. . . .=.
`,
  },
  {
    id: 'm6x6-3',
    listBlurb: '★★★',
    maze: `.=. .=.-.-*
  |
.-. . . . .
        | !
. . .-.-. .
!
.-. .=.=. .

@ .=. . . .
  |     !
. .-. .-. .
`,
  },
  {
    id: 'pivot-4x4-intro',
    listBlurb: 'Hướng dẫn',
    instruction: 'Đường nối màu xanh lá xoay quanh trục theo lưới, nhưng luôn chỉ về một hướng cố định',
    maze: `. .-* .
  |
. . . .

. .>. .

. @ . .
`,
  },
  {
    id: 'pivot-5x5-2',
    listBlurb: '★★',
    maze: `. . .-.-@

. .<. . .

.>. . . .
| !
.-.-. . *
  !
. . . . .
`,
  },
  {
    id: 'pivot-5x5-swirly',
    listBlurb: '★★★',
    maze: `. . . . .
      ^
.<. . . *

. . . . .

@ . . .>.
  v
. . . . .
`,
  },
  {
    id: 'pivot-5x5-1',
    listBlurb: '★★★',
    maze: `. .-. . .
      ^
. .<.=.=.

.>. . .-@

* . . .=.

. . . . .
`,
  },
  {
    id: 'pivot-5x5-3',
    listBlurb: '★★',
    maze: `.=. . .-*
    v
. . . . .

. . .-.J.

@-. . . .
    v
.<. . . .
`,
  },
  {
    id: 'pivot-5x5-4',
    listBlurb: '★★★',
    maze: `.-.-. @>.
!     ^
. . . . .
  |
. . . . .
  |
. . . .=*
    ^
. . .-. .>
`,
  },
  {
    id: 'pivot-5x5-5',
    listBlurb: '★★★',
    maze: `.-. . . *

. .>. . .
|       v
.-. . . .
  ^
. . .-. .
      v
@=.=. . .
`,
  },
  {
    id: 'pivot-5x5-6',
    listBlurb: '★★★',
    maze: `. . .>. .
  ! |
@=. .-. .

. . . .=.>

. . . . .

. *>.<. .
`,
  },
  {
    id: 'pivot-5x5-7',
    listBlurb: '★★★',
    maze: `* . @ . .
v   |
. . . . .
      !
. . . . .
^     ! !
. .-. . .
  !
. . . . .
    v
`,
  },
  {
    id: 'pivot-6x6-1',
    listBlurb: '★★★',
    maze: `. . . . . .
| v
@ . . . . *
  | |
. . . . . .
| !   ^ | K
. . . .-.=.
|
. .-. . . .
v
.>. . . . .
`,
  },
  {
    id: 'pivot-6x6-3',
    listBlurb: '★★★',
    maze: `. @-. .>.-.

. . . . . .
          |
* .>. .=. .
    !
. . . . . .>
      |   ^
. . . .=. .

. .=. . .=.>
`,
  },
  {
    id: 'pivot-6x6-2',
    listBlurb: '★★★',
    maze: `. .-.-. .=.
      v
. . . . . .
  |     ! v
.>. . . . *
    ^
. . . . . .
|
. .-.<. . .
! |       |
. . . .>.-@
`,
  },
  {
    id: 'm44',
    listBlurb: '★★',
    maze: `. .=. *-.

. . .=. .
!
. . . . .
  |   !
. . . . .
  |     |
. @ . .=.
`,
  },
  {
    id: 'm45',
    listBlurb: '★★',
    maze: `@ * .>. .

. .=.=. .
|     |
.>. . . .

. . . .>.
|
.=. . .-.
`,
  },
  {
    id: 'm46',
    listBlurb: '★★★',
    maze: `.-. . .
    ^
. . . .

.L. . .
      !
@ . .-*
`,
  },
  {
    id: 'm47',
    listBlurb: '★★',
    maze: `@ . . . . .
v v v v v v
. . . . . .

. . . . . .

. . . . . .
  v v v v v
. . . . . .

. . . .=. *
v v v v   v
`,
  },
  {
    id: 'm48',
    listBlurb: '★',
    maze: `.-.<.>.=. .
W !       |
. . .A. . *
    |   |
. .=. . . .
^ !
. .D.-.=.=@
          |
. . .-.-. .
|
.#.=. .<. .
    v     v
`,
  },
  {
    id: 'm49',
    listBlurb: '★★★',
    maze: `. . .-@ .
    |
. . . .J.

* . . . .
| !     !
. . . . .
    v   !
. . . .-.
`,
  },
  {
    id: 'm50',
    listBlurb: '★★★',
    maze: `*=. . .
    v
. . . .
^     |
. . . .
  ^   |
@ .>. .
`,
  },
  {
    id: 'rotate-tut',
    listBlurb: 'Hướng dẫn',
    instruction: 'Đường nối màu đỏ đứng yên tại chỗ, nhưng xoay theo lưới',
    maze: `. . . .

@ .4. .
  |
. . .-*

. . . .
`,
  },
  {
    id: 'rotate1',
    listBlurb: '★',
    maze: `. . .-*
    |
. . . .
    5
.4. . .
|
@ . . .
`,
  },
  {
    id: 'rotate2',
    listBlurb: '★★',
    maze: `@ .-.=.
    |
. . .4.
    |
* . . .
|   |
. . . .
`,
  },
  {
    id: 'rotate3',
    listBlurb: '★★',
    maze: `. . * .
! 5 v
. . . @
  |
. .4. .
  !
. . . .
`,
  },
  {
    id: 'rotate3b',
    listBlurb: '★★',
    maze: `* . . .
! 5
. . . @
  |
. .4. .
  !
. . . .
`,
  },
  {
    id: 'rotate-5x5-1',
    listBlurb: '★★',
    maze: `. . . .-@
      8
. .=. . .

*=. . . .

. .-. . .

. . . . .
`,
  },
  {
    id: 'rotate-5x5-2',
    listBlurb: '★★',
    maze: `. . . . .

. . . .6*
  |
. . . .=.
  |
.4. . . .
        |
. . . .-@
`,
  },
  {
    id: 'rotate-5x5-2b',
    listBlurb: '★★★',
    maze: `. . . . .
  !   |
.-.-. . .
  v   |
. . .-. .

@ . . . .
    5
. . .=* .
`,
  },
  {
    id: 'rotate-6x6-1',
    listBlurb: '★★★',
    maze: `@4.=. . . .

. . . . . .
      v 8 |
.-.-. . . .
!   !   ^
. . . . . .

. .>. . . .
!
* . .4. . .
`,
  },
  {
    id: 'rotate-6x6-2',
    listBlurb: '★★★',
    maze: `. . *<. . .

.=. .-. . .
        5
. . . .-. .
        |
. . . . . .

. . . . . .
    5     |
. .=. . @-.
`,
  },
  {
    id: 'rotate-6x6-3',
    listBlurb: '★★★',
    maze: `.4. . . . @
!
.-. . .=. .
!
. . . . . .
!
.>.6. . . .
!
. . . .=.-.
      ^
. . . . * .
`,
  },
];
